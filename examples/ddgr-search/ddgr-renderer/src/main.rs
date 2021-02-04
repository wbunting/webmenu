use lazy_static::lazy_static;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::from_reader;
use tera::{Context, Tera};

lazy_static! {
    pub static ref TEMPLATES: Tera = {
        let mut tera = Tera::default();
        let template = r#"{% for item in items %}
<li output="{{ item.url }}">
  <div class="flex flex-col my-2 mx-4">
    <h2 class="font-bold text-lg color-grey-300">{{ item.title }}</h2>
    <p class="text-xs font-mono text-green-400">{{ item.url }}</p>
    <p class="text-sm">{{ item.abstract }}</p>
  </div>
</li>
{% endfor %}"#;
        tera.add_raw_template("list.html", template)
            .expect("failed to render template");
        tera.autoescape_on(vec!["html"]);
        tera
    };
}

#[derive(Debug, Deserialize, Serialize, JsonSchema)]
struct Item {
    r#abstract: String,
    title: String,
    url: String,
}

#[derive(Debug, Deserialize, Serialize, JsonSchema)]
struct Items {
    items: Vec<Item>,
}

fn main() {
    // read the json output of the ddgr -nj command
    let input: Vec<Item> = from_reader(std::io::stdin()).expect("failed to parse json input");
    let items: Items = Items { items: input };

    let context =
        Context::from_serialize(&items).expect("failed to convert json to template context");

    let render = TEMPLATES
        .render("list.html", &context)
        .expect("failed to render template");

    println!("{}", render);
}
