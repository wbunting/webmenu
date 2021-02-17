use web_view::*;
use actix_web::{rt::System, body::Body, Responder, get, post, web, App, HttpRequest, HttpResponse, HttpServer};
use mime_guess::from_path;
use rust_embed::RustEmbed;
use std::{borrow::Cow, sync::mpsc, thread};
use clap::{Arg};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use x11::xlib;
use std::process::Command;

#[derive(RustEmbed)]
#[folder = "public"]
struct Asset;

fn assets(req: HttpRequest) -> HttpResponse {
    let path = if req.path() == "/" {
        // if there is no path, return default file
        "index.html"
    } else {
        // trim leading '/'
        &req.path()[1..]
    };

    // query the file from embedded asset with specified path
    match Asset::get(path) {
        Some(content) => {
            let body: Body = match content {
                Cow::Borrowed(bytes) => bytes.into(),
                Cow::Owned(bytes) => bytes.into(),
            };
            HttpResponse::Ok()
                .content_type(from_path(path).first_or_octet_stream().as_ref())
                .body(body)
        }
        None => HttpResponse::NotFound().body("404 Not Found"),
    }
}

fn window_id_string_to_hex(window_id: String) -> u64 {
  let this_x_window_id = u64::from_str_radix(window_id.trim_start_matches("0x").trim_end(), 16)
    .expect("failed parse window id");

  this_x_window_id
}

#[derive(Deserialize)]
struct Output {
   output: String,
}

#[post("/write")]
async fn write(info: web::Json<Output>) -> impl Responder {
    println!("{}", info.output);
    std::process::exit(0);
    HttpResponse::Ok()
}

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
  input: String,
  placeholder: Option<String>,
  parent_x_window_string_id: Option<String>
}

#[get("/init")]
async fn init(data: web::Data<AppState>) -> HttpResponse {

            match data.parent_x_window_string_id.clone() {
              Some(parent_id) => {
                let query_xwindow = Command::new("sh")
                  .arg("-c")
                  .arg("wmctrl -lx | grep \"webmenu.Webmenu\" | cut -d ' ' -f 1")
                  .output()
                  .expect("failed to get this xwindow");

                let this_x_window_string_id = String::from_utf8(query_xwindow.stdout)
                  .expect("failed to parse this xwindow id string");

                let this_x_window_id = window_id_string_to_hex(this_x_window_string_id);
                let parent_x_window_id = window_id_string_to_hex(parent_id.to_string());

                unsafe {
                  let display = xlib::XOpenDisplay(std::ptr::null());
                  xlib::XMapWindow(display, parent_x_window_id);

                  xlib::XReparentWindow(display, this_x_window_id, parent_x_window_id, 0, 0);
                  xlib::XFlush(display);
                };
              }
              None => {}
            }


  HttpResponse::Ok().json(AppState {
      input: data.input.clone(),
      placeholder: data.placeholder.clone(),
      parent_x_window_string_id: None
  })
}


#[actix_web::main]
async fn main() {
    let matches = clap::App::new("webmenu")
                          .about("A dead simple way to render a webview of options for the user to select from")
                          .arg(Arg::with_name("input")
                               .index(1)
                               .conflicts_with("source")
                               .help("the html input")
                          )
                          .arg(Arg::with_name("placeholder")
                              .short("p")
                              .long("placeholder")
                              .help("Sets placeholder text for fuzzy find")
                          )
                          .arg(Arg::with_name("windowid")
                              .short("w")
                              .long("windowid")
                              .takes_value(true)
                              .required(false)
                              .help("X window id to embed the webmenu in")
                           )
                          .get_matches();

    let input = matches.value_of("input").unwrap().to_string();

    let (server_tx, server_rx) = mpsc::channel();

    // start actix web server in separate thread
    thread::spawn(move || {
        let sys = System::new("http-server");

        let server = HttpServer::new(move || {
              let cors = Cors::permissive();

              let parent_x_window_string_id = match matches.value_of("windowid") {
                  Some(win) => Some(win.to_string()),
                  _ => None
              };

              let placeholder = match matches.value_of("placeholder") {
                    Some(p) => Some(p.to_string()),
                    _ => None
              };

              App::new()
                  .wrap(cors)
                  .data(web::JsonConfig::default().limit(4096))
                  .data(AppState {
                    input: input.clone(),
                    placeholder,
                    parent_x_window_string_id
                  })
                  .service(init)
                  .service(write)
                  .route("*", web::get().to(assets))
            })
            .bind("127.0.0.1:12395")?
            .shutdown_timeout(60)
            .run();

        // we specified the port to be 0,
        // meaning the operating system
        // will choose some available port
        // for us
        // get the first bound address' port,
        // so we know where to point webview at

        let _ = server_tx.send(server);
        sys.run()
    });

    let srv = server_rx.recv().unwrap();

    // start web view in current thread
    // and point it to a port that was bound
    // to actix web server
    web_view::builder()
        .title("Actix webview example")
        .content(Content::Url(format!("http://127.0.0.1:12395")))
        .size(400, 800)
        .resizable(true)
        .debug(true)
        .user_data(())
        .invoke_handler(|_webview, arg| {
            match arg {
              "exit" => {
                 std::process::exit(0);
              },
              _ => unimplemented!(),
            }
         })
        .run()
        .unwrap();

    srv.stop(true).await;
}
