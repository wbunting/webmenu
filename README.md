# webmenu

A dmenu like cli tool for generating a menu of options from a list of html elements and writing the output to standard out. 

*** DEMO ***

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
- [Recipies](#recipies)
- [Development](#development)
- [Philosophy](#philosophy)

## Why is this useful?

In the same way that [dmenu](https://tools.suckless.org/dmenu/) is useful for adding simple interactivity to applications. webmenu seeks to do the same but while allowing for a bit more flexibility in terms of styling the menu items. 

For example if you use a command line search engine like [ddgr](https://github.com/jarun/ddgr) the results are returned in such a way that if you directly pipe them into a dmenu you will be prompted with options for the description -- and selection an option will not output the url (instead it will output the document title of the result). 

To see how webmenu can be of more use here consider this one-liner search example:

```bash
echo "" | 
dmenu -i -p "Search" | 
xargs -I{} ddgr -np "{}" | 
ddgr-to-html | 
xargs -0 -I{} webmenu -s "{}" |
xargs -I{} $BROWSER "{}"
```

Now the job is only to fill in the data transformation step which you could do via whatever method you please! Here's a trivial transformation with Node.js which we can convert to a binary using [pkg](https://github.com/vercel/pkg):

```js
// ddgr-to-html.js
let input_stdin = "";

const stdin = process.openStdin();

stdin.on("data", (data) => {
  input_stdin += data;
});
stdin.on("end", () => {
  main();
  process.exit();
});

const main = () => {
  const jsonData = JSON.parse(input_stdin);
  const html = jsonData
    .map(
      ({
        abstract,
        title,
        url,
      }) => `<li class="rounded-lg overflow-hidden" output="${url}">
          <div class="flex items-center">
            <div class="">
              <h2 class="font-bold text-lg">${title}</h2>
              <p class="text-sm">${abstract}</p>
            </div>
          </div>
        </li>`
    )
    .join("");
  console.log(html);
};
```

The result is a simple pipeline for searching for data, browsing the results in whatever UI you like and then pointing to the results. You do all of this without ever visiting a page that has trackers to invade your privacy.

It is also nice to bind scripts like this to a hotkey so that you can easily search for things without ever leaving the keyboard. 

## Installation

### Pre-built binaries

Check the releases page for a binary for your operating system (only Linux for now...).

### From Source

To compile from source, first clone the repository. Then run:

```bash
yarn install && yarn tauri build
```

This will create the binaries for your operating system in: `./src-tauri/release/target/`


## Usage

Construct a simple html file containing li elements that you would like the user to select from. 

```html
<li output="first">First</li>
<li output="second">Second</li>
<li output="third">Third</li>
```


Run `webmenu` and pass the `items.html` as an argument.

```bash
webmenu -s items.html
```

After the user selects a choice the `output` attribute will be written to standard output. 

### Styling

Styling now is all done via [tailwindcss](https://tailwindcss.com/) tags. The benefit in this particular case is that there is no extra style file or `<style>` tag necessary for rendering the list elements. 

Two things we will probably support in the future:
- An external CSS file as a command line argument
- Respecting GTK theme / xrdb colors. 


## Recipies

### Search menu
```bash
#!/bin/sh
# scripts/ddgr
echo "" | 
dmenu -i -p "Search" | 
xargs -I{} ddgr -np "{}" | 
ddgr-to-html | 
xargs -0 -I{} webmenu -s "{}" |
xargs -I{} $BROWSER "{}"
```

See above for an implementation of ddgr-to-html in Node.js. You can find it in the scripts folder of this repository. 

### Video watching menu

```bash
#!/bin/sh
# scripts/youtube-search

# prompt search
echo "" | 
dmenu -i -p "🔎 Search" |
# url encode spaces
sed 's/ /+/g' | 
# curl down the yotube search page
xargs -I{} curl -L "https://youtube.com/results?search_query={}" |
# extract the initial data and manipulate it to json
sed -n '/var ytInitialData/,/};/p' |
head -n 1 |
sed -e 's/.*var ytInitialData = \(.*}\);.*/\1/' > /tmp/webmenu/search.json && 
cat /tmp/webmenu/search.json |
# the JSON from youtube contains a bunch of things we don't need so just remove those 
simplify-youtube-json |
# take the json and make some li elements to show in webmenu
youtube-json-renderer | 
# prompt the webmenu
xargs -0 -I{} webmenu -s '{}' |
# show the result in mpv
xargs -I{} mpv --ytdl-format="bestvideo[height<=?720][fps<=?30][ext=webm]+bestaudio/best" "{}"

```

## Development

For reasons unknown to me at the moment it looks like the Tauri dev server doesn't accept CLI arguments. So to develop you'll need to modify the frontend code with a manual input of list elements instead of getting it from the CLI arguments. 


## Philosophy

- Web users should not have to run untrusted javascript in browsers to do basic navigation
- There is a lot of duplicated work in creating listview UI for the web. This aims to just coalesce all those implementations into a single binary.
- Browsers should not be the only (or even primary?) way of interfacing with the web. They are good for some things, but require lots of clicks and execute somewhat arbitrary code on users systems that is not free.
- UNIX philosophy is HARDER to write good code for than a monolith application, but it generally produces longer lasting applications
  
### Why HTML?

- Our core uses Rust for the messaging between the binary and the webview, we could have easily used some binding to produce list UI in GTK etc, but this is much harder for end users to learn. HTML is widely known and inherently secure as just a markup language (except for the <script> tag). 

### Why Webview?

We want to render HTML on the users's system. There are a lot of ways to do this (could use a browser etc.), but Webview is one of the lighest weight ways to do this and avoids the bloat of Electron.  

### Why Taliwindcss?

Tailwind essentially IS just plain CSS, but it ends up with easier to maintain code due to not having to come up with your own classnames for everything, while still respecting the cascade. If you didn't realize naming things is hard. 

### Why Svelte?

No reason -- it's somewhat minimal and easy to set up -- eventually we can probably deprecate SVELTE for a more simple templating engine written on the Rust side

### Why Tauri?

Very easy to get started, and comes with webview which we need. But as with Svelte it's probably not critical to the architecture and is a candidate for being replaced with just streaming html and our injected js directly to webview via the webview crate. 
