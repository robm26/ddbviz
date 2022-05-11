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
    // console.log({result:result});

    return({result: result});
}

export const loader = async ({ params, request }) => {
    return {
        region:params.region,
        database:database,
        host:host
    };
};


export default function SqlIndex() {
    const data = useLoaderData();
    const actionData = useActionData();
    const keepfor = 365;
    const ttl = '  unix_timestamp(date_add(now(),interval ' + keepfor + ' day)) as ttl\n';
    // let stmt = 'SELECT customer_id, ' +
    //     '"Luna" as customer_id, ' +
    //     '\ncustomer_name, address, "Marco" as customer_id, ' +
    //     '\nunix_timestamp(date_add(now(),interval 0 day)) as now_time, ' +
    //     '\nunix_timestamp(date_add(now(),interval ' + keepfor + ' day)) as ttl_' + keepfor +
    //     '\nFROM customers \nlimit 3';

    let stmt = '(select \n' +
        '  \'customer\'     as type,\n' +
        '  customer_id    as "c.customer_id", \n  customer_name  as "c.customer_name", \n  notes          as "c.notes",' +
        '\n  null           as "o.order_id", \n  null           as "o.customer_id", \n  null           as "o.notes", \n' +
        ttl +
        'from customers c \nlimit 3) \n' +
        '\n' +
        'union all\n' +
        '\n' +
        '(select \n' +
        '  \'order\'     as type,\n' +
        '  null,\n  null,\n  null,\n' +
        '  order_id,\n  customer_id,\n  notes, \n' +
        ttl +
        'from orders o \nlimit 3) \n';

    const [sql, setSql] = React.useState(stmt);

    const clearSql = () => {
        setSql('');
        return null;
    };

    const handleSqlUpdate = (val) => {
        setSql(val.target.value);
    };

    let rows = 0;
    let cols = 0;
    if(actionData?.result && !actionData?.result?.error) {
        let dataset = actionData?.result;
        rows = dataset.length;
        cols = Object.keys(dataset[0]).length;
        // console.log(JSON.stringify(dataset, null, 2));
    }

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
            &nbsp; &nbsp; &nbsp;
            {rows && rows > 0 ? (<span>rows: {rows}</span>) : null}
            &nbsp;&nbsp;
            {cols && cols > 0 ? (<span>columns: {cols}</span>) : null}
        </td></tr></tbody>
        </table>
    </Form>);

    let connLabel = {database:data.database, host:data.host};

    return (
        <div >
            <Menu region={data.region} pageTitle={'SQL'} sqlConn={connLabel} />

            <div className='sqlContainer'>
                {sqlForm}
                <br/>
                {actionData?.result?.error ?
                    (<div className='errorPanel'>{actionData.result.error?.code}<br/>{actionData.result.error?.sqlMessage}</div>)
                    : ( <SqlGrid data={actionData?.result} />)
                }

            </div>

        </div>
    );
}

