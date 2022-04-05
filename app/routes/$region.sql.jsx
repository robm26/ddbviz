import {
    useLoaderData, Link, Form, useFetcher, useActionData
} from "remix";


import { Menu } from "~/components/menu";

import {SqlGrid} from "~/components/SqlGrid";

import {runSql, database, host} from "~/components/mysql";


export async function action({ request }) {

    const body = await request.formData();

    const sqlStmt = body?._fields['sqlText'][0];

    const result = await runSql(sqlStmt);

    return({result: result});

}

export const loader = async ({ params, request }) => {
    // const url = new URL(request.url);
    //
    // const stmt = 'SELECT * FROM customer_features.v_features limit 7';
    //
    // // console.log(url);
    // const result = await runSql(stmt);
    // console.log('***** result ' + Object.keys(result));
    console.log(params);

    return {
        region:params.region,
        // result:result,
        // url:request.url,
        database:database,
        host:host
    };

};

// const handleSqlRun = async (stmt) => {
//     const result = await runSql(sql);
//     return result;
// };

export default function SqlIndex() {
    const data = useLoaderData();
    const fetcher = useFetcher();
    const actionData = useActionData();


    let stmt = 'SELECT * \nFROM v_features \nlimit 30';

    const [sql, setSql] = React.useState(stmt);
    const [rows, setRows] = React.useState([]);

    // const resList = (<ul>{Object.keys(data.result).map(item=>(<li>{item}</li>))} </ul>);
    // console.log(data.result);
    const clearSql = () => {
        setSql('');
        return null;
    };

    const handleSqlUpdate = (val) => {
        setSql(val.target.value);
    };

    const sqlForm = (<Form method="post" action={'/' + data.region + '/sql'} >
        <table className='sqlTableForm'>
        <thead></thead>
        <tbody><tr><td>
            <textarea name='sqlText'
                value={sql}
                onChange={handleSqlUpdate}
            />
        <br/>
        <button type='submit'>
            RUN SQL
        </button>
            &nbsp;&nbsp;&nbsp;
        <Link to={'.'} >
            <button type='submit' onClick={()=>{ clearSql() }} >CLEAR</button>
        </Link>

        </td></tr></tbody>
        </table>
    </Form>);

    let connLabel = {database:data.database, host:data.host};

    return (
        <div >
            <Menu region={data.region} pageTitle={'SQL'} sqlConn={connLabel} />

            <div className='sqlContainer'>
                {sqlForm}
                <SqlGrid data={actionData?.result} />
            </div>

        </div>
    );
}

