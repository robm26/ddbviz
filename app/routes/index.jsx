import {
    Links,
    Link,
    Outlet
} from "remix";

import { Menu } from "~/components/menu";


export default function Index() {

  return (

      <div>
          <Menu />

        <Outlet/>

    </div>
  );
}

