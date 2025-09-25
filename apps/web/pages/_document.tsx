import Document, { Html, Head, Main, NextScript } from 'next/document';

// Minimal custom Document to satisfy Next's build-time page resolution.
// We keep it intentionally simple because the app router handles most layout.
export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
