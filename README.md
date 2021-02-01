# webmenu

A dmenu like cli tool for generating a menu of options from a list of html elements and writing the output to standard out. 

*** DEMO ***

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)

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

### From Source

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



## Recipies

### Search menu



## Development


## Philosophy

### Why HTML?

### Why Webview?

### Why Taliwindcss?

Tailwind essentially IS just plain CSS, but it ends up with easier to maintain code due to not having to come up with your own classnames for everything, while still respecting the cascade. If you didn't realize naming things is hard. 

