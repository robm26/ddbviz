import {
    Link, Form, useLoaderData
} from "remix";

import {config} from "../configuration";

let prices = config().prices;

let debug = '';

import stylesUrl from "../styles/grid.css";

export const links = () => {
    return [{rel:"stylesheet", href:stylesUrl }];
};

export const action = async ({request}) => {
    const body = await request.formData();
    console.log(JSON.stringify(body, null, 2));

    return null;

};
let region;

export const loader = async ({ params }) => {
    let region;
    if(params.region.substring(0,9) === 'localhost') {
        region = 'us-east-1';
    } else {
        region = params.region;
    }
    return {
        region: region
    }
};


export function TableGrid(props) {

    const data = useLoaderData();

    let region;
    if(data.region.substring(0,9) === 'localhost') {region = 'us-east-1';} else {region = data.region;}

    const [sortAttr, setSortAttr] = React.useState('SizeMB');
    const [sortDirection, setSortDirection] = React.useState('1');

    const sortSorter = (sa) => {
        if(sa === sortAttr) {
            setSortDirection(sortDirection * -1);
        }
        setSortAttr(sa);
    };

    if(props.metadatas.length === 0) {
        return(<h3>no tables found</h3>);
    }
    let rows = [];

    props.metadatas.map((table)=>{

        let SizeMB = table.TableSizeBytes / (1024 * 1024);
        if(SizeMB > 20) {
            SizeMB = Math.round(SizeMB);
        } else {
            SizeMB = Math.round(SizeMB * 10000)/10000;
        }

        let CapacityMode = 'PROVISIONED';
        if(table?.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST') {
            CapacityMode = 'ON DEMAND';
        }
        let ProvisionedRCU = table?.ProvisionedThroughput?.ReadCapacityUnits;
        let ProvisionedWCU = table?.ProvisionedThroughput?.WriteCapacityUnits;
        let GsiCount = 0;
        if(table?.GlobalSecondaryIndexes) {
            GsiCount = table.GlobalSecondaryIndexes.length;
        }
        // let storageCost = SizeMB * prices[region]

        let StorageCostStd = SizeMB * prices[region].standard.storage / 1024;
        let StorageCostIA = SizeMB * prices[region].infrequentAccess.storage / 1024;

        let ReadCostStd = ProvisionedRCU * prices[region].standard.provisionedRCU * 24 * 30;
        let ReadCostIA = ProvisionedRCU * prices[region].infrequentAccess.provisionedRCU * 24 * 30;

        let WriteCostStd = ProvisionedWCU * prices[region].standard.provisionedWCU * 24 * 30;
        let WriteCostIA = ProvisionedWCU * prices[region].infrequentAccess.provisionedWCU * 24 * 30;

        let TotalCostStd = StorageCostStd + ReadCostStd + WriteCostStd;
        let TotalCostIA = StorageCostIA + ReadCostIA + WriteCostIA;
        let DeltaIA = TotalCostIA - TotalCostStd;


        rows.push({
            TableName:table.TableName,
            IndexName:'-',
            GsiCount:GsiCount,
            ItemCount:table.ItemCount,
            SizeMB:SizeMB,
            CapacityMode:CapacityMode,
            ProvisionedRCU:ProvisionedRCU,
            ProvisionedWCU:ProvisionedWCU,
            StorageCostStd:StorageCostStd,
            StorageCostIA:StorageCostIA,
            ReadCostStd:ReadCostStd,
            ReadCostIA:ReadCostIA,
            WriteCostStd:WriteCostStd,
            WriteCostIA:WriteCostIA,
            TotalCostStd:TotalCostStd,
            TotalCostIA:TotalCostIA,
            DeltaIA:DeltaIA
        });
    });

    let sortedRows = [...rows];

    sortedRows.sort((a,b)=> {
        const x = typeof a[sortAttr] === 'string' ? a[sortAttr].toUpperCase() : a[sortAttr];
        const y = typeof b[sortAttr] === 'string' ? b[sortAttr].toUpperCase() : b[sortAttr];
        if (x > y) {return -1 * sortDirection;}
        if (x < y) {return 1 * sortDirection;}
        return 0;
    });

    const tabhead = (
        <thead>
        <tr>
            <th colSpan="7"></th><th colSpan="9" ><div className="monthlyLabel">Monthly Cost in USD</div></th>
        </tr>
        <tr>
            <th><button onClick={()=>{sortSorter('TableName')}}>Table Name</button></th>
            <th><button onClick={()=>{sortSorter('GsiCount')}}>GSI Count</button></th>

            <th><button onClick={()=>{sortSorter('ItemCount')}}>Item Count</button></th>
            <th><button onClick={()=>{sortSorter('SizeMB')}}>Size in MB</button></th>
            <th><button onClick={()=>{sortSorter('CapacityMode')}}>Capacity Mode</button></th>
            <th><button onClick={()=>{sortSorter('ProvisionedRCU')}}>Provisioned RCU</button></th>
            <th><button onClick={()=>{sortSorter('ProvisionedWCU')}}>Provisioned WCU</button></th>

            <th><button onClick={()=>{sortSorter('StorageCostStd')}}>Storage Cost Std</button></th>
            <th><button onClick={()=>{sortSorter('StorageCostIA')}}>Storage Cost IA</button></th>

            <th><button onClick={()=>{sortSorter('ReadCostStd')}}>Read Cost Std</button></th>
            <th><button onClick={()=>{sortSorter('ReadCostIA')}}>Read Cost IA</button></th>

            <th><button onClick={()=>{sortSorter('WriteCostStd')}}>Write Cost Std</button></th>
            <th><button onClick={()=>{sortSorter('WriteCostIA')}}>Write Cost IA</button></th>

            <th><button onClick={()=>{sortSorter('TotalCostStd')}}>Total Cost Std</button></th>
            <th><button onClick={()=>{sortSorter('TotalCostIA')}}>Total Cost IA</button></th>

            <th><button onClick={()=>{sortSorter('DeltaIA')}}>Difference</button></th>
        </tr>
        </thead>
    );

    const tab = (<table id={'dataTable'}>

        {tabhead}
        <tbody>

            {sortedRows.map((row)=>{
                return <tr key={row.TableName}>
                    <td>{row.TableName}</td>
                    <td>{row.GsiCount}</td>
                    <td>{row.ItemCount}</td>
                    <td>{row.SizeMB.toLocaleString()}</td>
                    <td>{row.CapacityMode}</td>
                    <td>{row.ProvisionedRCU === 0 ? '-' : row.ProvisionedRCU}</td>
                    <td>{row.ProvisionedWCU === 0 ? '-' : row.ProvisionedWCU}</td>
                    <td className="StorageCostStd">{rounder(row.StorageCostStd)}</td>
                    <td className="StorageCostIA" >{rounder(row.StorageCostIA)} </td>
                    <td className="ReadCostStd">{rounder(row.ReadCostStd)}</td>
                    <td className="ReadCostIA" >{rounder(row.ReadCostIA)} </td>
                    <td className="WriteCostStd">{rounder(row.WriteCostStd)}</td>
                    <td className="WriteCostIA" >{rounder(row.WriteCostIA)} </td>

                    <td className="TotalCostStd">{rounder(row.TotalCostStd)}</td>
                    <td className="TotalCostIA" >{rounder(row.TotalCostIA)} </td>

                    <td className={row.DeltaIA >= 0 ? "DeltaIA_pos" : "DeltaIA_neg"} >{rounder(row.DeltaIA)} </td>

                </tr>
            })}

        </tbody>
    </table>);

    return (
        <Form id="gridform" method="post" >
            {tab}
        </Form>);
}

function rounder(val) {
    if(val === 0) {return '-';}

    let places = 2;

    if(Math.abs(val) < 0.01 ) {places = 3;}

    return ( val.toFixed(places));

}
