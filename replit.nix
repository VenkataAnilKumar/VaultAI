{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    # Required for better-sqlite3 native bindings
    pkgs.python3
    pkgs.gcc
    pkgs.gnumake
    # Required for canvas/image processing (pdf-parse dependency)
    pkgs.pkg-config
    pkgs.cairo
    pkgs.pango
    pkgs.libpng
    pkgs.libjpeg
    pkgs.giflib
    pkgs.librsvg
    # PDF native deps
    pkgs.openssl
  ];
}
