# Maintainer: wbunting

pkgname=webmenu-bin
pkgver=0.1.2
pkgrel=1
pkgdesc="A simple webview renderer for html list items"
url="https://github.com/wbunting/webmenu"
arch=("x86_64")
license=("GPL-3.0-only")
provides=("webmenu")
options=("strip")
source=("https://github.com/wbunting/webmenu/releases/download/webmenu-v${pkgver}/webmenu_${pkgver}_x64.app.tgz")
sha256sums=("ae55c62434473ab0c207f75760758b6c584c7ca6cdfddca299094cce63d4f1c3")

package() {
    install -Dm755 webmenu -t "$pkgdir/usr/bin/"
}
