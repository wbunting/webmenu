# ddgr-search

This example renders a search prompt with dmenu and then pipes the search results from ddgr into a webmenu for selecting the site. From there we just pipe it into your `$BROWSER` but much more could be done eg. around which application opens which kind of URL.

Running the `ddgr-search` script requires that there be a binary for `ddgr-renderer`. You have two choices for building the binary Node.js or Rust. 

## Rust

To build the binary in Rust simply cd into `ddg-renderer` and then

```bash
cargo build --release
```

You'll find the binary at `examples/ddgr-search/target/releases/ddgr-renderer`, which you need to put into your `PATH` variable. 

## Node.js

For Node you'll first need pkg:

```bash
npm install -g pkg
```

then simply:

```
pkg ddgr-renderer.js
```

to create the binary. Note by default this builds for all operating systems. You can specify yours with the `--target` flag to pkg. 
