import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "remix";


import { Menu } from "~/components/menu";


import stylesShared from "./styles/shared.css";
import stylesGrid from "./styles/grid.css";

export const links = () => {
    return [
        {rel:"stylesheet", href:stylesShared },
        {rel:"stylesheet", href:stylesGrid }
    ];
};

export function meta() {
  return { title: "DDB VIZ" };
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />

        <Links />
      </head>
      <body>
      <div className="rootContainer">

        <Outlet />
      </div>
        {/*<ScrollRestoration />*/}
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
