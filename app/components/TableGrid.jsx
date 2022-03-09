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

        let GsiSize = 0;
        if(table?.GlobalSecondaryIndexes) {
            table.GlobalSecondaryIndexes.map((idx)=> {
                GsiSize += idx?.IndexSizeBytes;
            });
        }

        let TotalSizeMB = SizeMB + (GsiSize / (1024 * 1024));

        if(SizeMB > 20) {
            SizeMB = Math.round(SizeMB);
        } else {
            SizeMB = Math.round(SizeMB * 10000)/10000;
        }

        if(TotalSizeMB > 20) {
            TotalSizeMB = Math.round(TotalSizeMB);
        } else {
            TotalSizeMB = Math.round(TotalSizeMB * 10000)/10000;
        }

        let CapacityMode = 'PROVISIONED';
        if(table?.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST') {
            CapacityMode = 'ON DEMAND';
        }
        let ProvisionedRCU = table?.ProvisionedThroughput?.ReadCapacityUnits;
        let ProvisionedWCU = table?.ProvisionedThroughput?.WriteCapacityUnits;
        let GsiCount = 0;
        if(table?.GlobalSecondaryIndexes ) {
            GsiCount = table.GlobalSecondaryIndexes.length;
            if (CapacityMode === 'PROVISIONED') {
                table.GlobalSecondaryIndexes.map((idx)=> {
                    ProvisionedRCU += idx.ProvisionedThroughput?.ReadCapacityUnits;
                    ProvisionedWCU += idx.ProvisionedThroughput?.WriteCapacityUnits;
                });
            }

        }

        let StorageCostStd = TotalSizeMB * prices[region].standard.storage / 1024;
        let StorageCostIA = TotalSizeMB * prices[region].infrequentAccess.storage / 1024;

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
            TotalSizeMB:TotalSizeMB,
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
            DeltaIA:DeltaIA,
            Metadata:table
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
            <th colSpan="8"></th><th colSpan="9" ><div className="monthlyLabel">Monthly Cost in USD</div></th>
        </tr>
        <tr>
            <th><button onClick={()=>{sortSorter('TableName')}}>Table Name</button></th>
            <th><button onClick={()=>{sortSorter('ItemCount')}}>Item Count</button></th>
            <th><button onClick={()=>{sortSorter('SizeMB')}}>Size in MB</button></th>
            <th><button onClick={()=>{sortSorter('TotalSizeMB')}}>Size with GSIs</button></th>

            <th><button onClick={()=>{sortSorter('GsiCount')}}>GSI Count</button></th>

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

    const tab = (<table className='tableTable'>

        {tabhead}
        <tbody>

            {sortedRows.map((row)=>{
                return <tr key={row.TableName}>
                    <td>
                        <Link to={row.TableName + '/stats'} state={row.Metadata} >
                            {row.TableName}
                        </Link>
                    </td>
                    <td>{row.ItemCount.toLocaleString()}</td>
                    <td>{row.SizeMB.toLocaleString()}</td>
                    <td>{row.TotalSizeMB.toLocaleString()}</td>

                    <td>{row.GsiCount}</td>
                    <td className={row.CapacityMode === 'ON DEMAND' ? 'OnDemand' : 'Provisioned'} >{row.CapacityMode}</td>
                    <td>{row.ProvisionedRCU === 0 ? '-' : row.ProvisionedRCU}</td>
                    <td>{row.ProvisionedWCU === 0 ? '-' : row.ProvisionedWCU}</td>
                    <td>{rounder(row.StorageCostStd)}</td>
                    <td>{rounder(row.StorageCostIA)} </td>
                    <td>{rounder(row.ReadCostStd)}</td>
                    <td>{rounder(row.ReadCostIA)} </td>
                    <td>{rounder(row.WriteCostStd)}</td>
                    <td>{rounder(row.WriteCostIA)} </td>

                    <td className="TotalCostStd">{rounder(row.TotalCostStd)}</td>
                    <td className="TotalCostIA" >{rounder(row.TotalCostIA)} </td>

                    <td className={row.DeltaIA >= 0 ? "DeltaIA_pos" : "DeltaIA_neg"} >{rounder(row.DeltaIA)} </td>

                </tr>
            })}

        </tbody>
    </table>);

    return (
        <Form id="tablegridform" method="post" >
            {tab}
        </Form>);
}

function rounder(val) {
    if(Math.abs(val) === 0 || Math.abs(val) < 0.0001) {return '-';}

    let places = 2;

    if(Math.abs(val) < 0.01 ) {places = 3;}

    return ( val.toFixed(places));

}
