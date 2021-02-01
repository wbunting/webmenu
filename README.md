

# webmenu

A dmenu like cli tool for generating a menu of options from a list of html elements. 

*** DEMO ***

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)

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

## Recipies

### Search menu



## Development


## Philosophy


