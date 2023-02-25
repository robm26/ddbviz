import {
    Link, Form, useLoaderData
} from "remix";


import stylesUrl from "../styles/grid.css";

export const links = () => {
    return [{rel:"stylesheet", href:stylesUrl }];
};


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
    const pricer = data.prices;

    let region;
    if(data.region.substring(0,9) === 'localhost') {region = 'us-east-1';} else {region = data.region;}

    let priceRegion = region === 'us-east-1' ? '' : (region.slice(0,2) + region.slice(3,4) + region.split('-')[2] + '-').toUpperCase();
    priceRegion = region === 'eu-west-1' ? 'EU' : priceRegion;

    if(data.region === 'demo') {
        priceRegion = '';
    }


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
        let Replicas = [];
        if(table?.Replicas) {
            table.Replicas.map((replica)=>{


                Replicas.push(replica);
            });
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

        // console.log(' ----- ' + Object.keys(pricer));
        // console.log('-TimedStorage-ByteHrs ['+priceRegion+']: ' + pricer[priceRegion + 'TimedStorage-ByteHrs']);


        let StorageCostStd = 0;
        let StorageCostIA = 0;

        let ReadCostStd = 0;
        let ReadCostIA = 0;

        let WriteCostStd = 0;
        let WriteCostIA = 0;

        // update if pricing API data available

        if(pricer && pricer[priceRegion + 'TimedStorage-ByteHrs']) {
            StorageCostStd = TotalSizeMB * pricer[priceRegion + 'TimedStorage-ByteHrs'] / 1024;
            StorageCostIA = TotalSizeMB * pricer[priceRegion + 'IA-TimedStorage-ByteHrs'] / 1024;

            ReadCostStd = ProvisionedRCU * pricer[priceRegion + 'ReadCapacityUnit-Hrs'] * 24 * 30;
            ReadCostIA = ProvisionedRCU * pricer[priceRegion + 'IA-ReadCapacityUnit-Hrs'] * 24 * 30;

            WriteCostStd = ProvisionedWCU * pricer[priceRegion + 'WriteCapacityUnit-Hrs'] * 24 * 30;
            WriteCostIA = ProvisionedWCU * pricer[priceRegion + 'IA-WriteCapacityUnit-Hrs'] * 24 * 30;
        }


        let TotalCostStd = 0;
        let TotalCostIA = 0;
        let DeltaIA = 0;

        if(CapacityMode === 'PROVISIONED') {
            TotalCostStd = StorageCostStd + ReadCostStd + WriteCostStd;
            TotalCostIA = StorageCostIA + ReadCostIA + WriteCostIA;
            DeltaIA = TotalCostIA - TotalCostStd;
        }

        const gtSize = table?.Replicas?.length + 1 || 1;
        let ItemCount = table.ItemCount;

        // Global Table multiplier
        // ItemCount *= gtSize;
        // StorageCostStd *= gtSize;
        // StorageCostIA *= gtSize;
        // WriteCostStd *= gtSize;
        // WriteCostIA *= gtSize;
        // SizeMB *= gtSize;
        // TotalSizeMB *= gtSize;



        rows.push({
            TableName:table.TableName,
            IndexName:'-',
            GsiCount:GsiCount,
            ItemCount:ItemCount,
            SizeMB:SizeMB,
            TotalSizeMB:TotalSizeMB,
            CapacityMode:CapacityMode,
            Replicas:Replicas,
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

            <th><button onClick={()=>{sortSorter('ProvisionedRCU')}}>Prov. RCU</button></th>
            <th><button onClick={()=>{sortSorter('ProvisionedWCU')}}>Prov. WCU</button></th>

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

    function fc(term) {
        if(typeof term === 'string') {
            return parseFloat(term).toLocaleString();
        } else {return(term).toLocaleString();}
    }

    const tab = (<table className='tableTable'>

        {tabhead}
        <tbody>

            {sortedRows.map((row)=>{


                const replicas = (<div >{row?.Replicas.map((replica, index) => {
                    const repContinent = replica.RegionName.substring(0,2);

                    const repIcon = ['us','ca','sa'].includes(repContinent)
                        ? '🌎' : ['eu','af','me'].includes(repContinent) ? '🌍' : '🌏';



                    return (<span title={'Global Table Replica in ' + replica.RegionName + ', click to view its size and cost'} key={index}>
                        <Link key={index} className='replicas'
                              to={'/' + replica.RegionName + '/' + row.TableName + '/stats'}  >
                            {repIcon}
                        </Link></span>);
                })}</div>)

                return <tr key={row.TableName}>
                    <td>
                        <Link to={row.TableName + '/stats'} state={row.Metadata} >
                            {row.TableName}
                        </Link>
                        {replicas}
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

                    <td className="TotalCostStd">{rounder(row.TotalCostStd).toLocaleString()}</td>
                    <td className="TotalCostIA" >{rounder(row.TotalCostIA).toLocaleString()} </td>

                    <td className={row.DeltaIA >= 0 ? "DeltaIA_pos" : "DeltaIA_neg"} >{rounder(row.DeltaIA).toLocaleString()} </td>

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
    let ret = Number(val.toFixed(places)).toLocaleString();
    ret = ret.slice(-2,-1) === '.' ? ret + '0' : ret;
    return (ret);

}
