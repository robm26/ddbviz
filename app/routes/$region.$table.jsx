import {
    Link, useLoaderData,
} from "remix";

export const loader = async ({ params }) => {
    return params;
};

import { Menu } from "~/components/menu";

export default function TableDetails() {
    const data = useLoaderData();

    return (
        <div className="TableDetails">
            <Menu region={data.region} />
            <br />

            {/*data: {JSON.stringify(data)}*/}
            <br />
            Region: {data.region}
            <br />
            Table:
            {data.table}
        </div>
    );
}

