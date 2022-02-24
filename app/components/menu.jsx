import {
    Link, NavLink,
    useLoaderData,
    useTransition, Form, redirect
} from "remix";

import {config} from "~/configuration";


export function Menu(params) {
    const data = useLoaderData();
    const transition = useTransition();
    const stats = params?.stats;

    const gsi = params?.gsi;  // gsi preview
    const setGsi = params?.setGsi;


    const [pk1, setPk1] = React.useState(params?.pk);  // query textbox sets, query button reads
    const [sk1, setSk1] = React.useState(params?.sk);
    const [getmode, setGetmode] = React.useState('get');


    const handleQuerybox = (val) => {
        setPk1(val.target.value);
    };
    const handleGetbox = (val) => {
        let mySK = val.target.value;
        if (mySK.slice(0,1) === '<' || mySK.slice(0,1) === '>' || mySK.slice(-1) === '*') {
            setGetmode('query');
        } else {
            setGetmode('get');
        }
        setSk1(val.target.value);

    };


    const transitionDisplay = () => {
        const hourglass =
            transition.state === "submitting"
                ? "⏳"
                : transition.state === "loading"
                ? "⏳"
                : null;
        return hourglass;
    };

    let regionList = config().regions;


    if(data && data?.region ) {
        regionList = [data.region] ;
    }

    if (params?.region) {
        regionList = [params.region];
    }

    let tableTitle;
    let readForm;

    if(params?.table) {
        const path = '/' + params.region + '/' + params.table;

        let maxSize = 0;

        const TableSizeBytes = data.metadata.TableSizeBytes;
        const ItemCount = data.metadata.ItemCount;
        const gsis = data.metadata?.GlobalSecondaryIndexes;

        let tableName = params.table;
        let indexName;
        const caretPosition = tableName.indexOf("^");
        if(caretPosition >= 0) {
            indexName = tableName.substring(caretPosition + 1);
            tableName = tableName.substring(0, caretPosition);
        }
        const pk = params?.pk;
        const sk = params?.sk;

        const handleHover = (newGsi) => {

            if (typeof gsi !== 'undefined') {setGsi(newGsi);}
        };


        if(gsis) {

            gsis.sort( function( a , b){
                if(a.IndexName > b.IndexName) return 1;
                if(a.IndexName < b.IndexName) return -1;
                return 0;
            });

        }
        tableTitle = (
            <div className="tableTitle">

                <div onMouseEnter={() => (  handleHover('') )} >
                    &nbsp;
                    <Link to={'/' + params.region} ><span className="emoji"> 📙</span></Link>
                    &nbsp;
                    <Link to={'/' + params.region + '/' + tableName} className={indexName ? null : 'selected'}>

                        {tableName}

                    </Link> &nbsp;&nbsp;
                    <span className="emoji" >
                        {Math.round(TableSizeBytes/1000).toLocaleString()} KB {ItemCount.toLocaleString()} items
                    </span>
                </div>


                {gsis && gsis.map((item, index)=>{


                    const gsiSizeRatio = Math.round(100 * item.IndexSizeBytes / TableSizeBytes)/100;
                    const cssBar = 'linear-gradient(90deg, silver ' + gsiSizeRatio*100 + '%, gainsboro ' + (gsiSizeRatio)*100 + '%)';

                    const divStyle = {
                        'color': 'dimgray' ,
                        'margin' : '4px',
                        'paddingRight' : '4px',
                        'paddingBottom': '4px',
                        'borderRadius': '5px',
                        'border': item.IndexName === gsi && !indexName ? '1px solid blue' : '1px solid silver',
                        'background': cssBar
                    };


                    return (<div key={item.IndexName}  style={divStyle}
                                 onMouseEnter={() => handleHover(item.IndexName)}
                    >

                        &nbsp;&nbsp;&nbsp;
                        <span className="emoji">📒</span>
                        &nbsp;&nbsp;

                        <Link to={'/' + params.region + '/' + tableName + '^' + item.IndexName} className={item.IndexName === indexName ? 'selected': null} >
                            {item.IndexName}
                        </Link>

                        &nbsp;&nbsp;

                        <span className="emoji" >
                        {Math.round(item.IndexSizeBytes/1000).toLocaleString()} KB  {Math.round(item.ItemCount).toLocaleString()} items
                        </span>
                    </div>);
                })}

            </div>);

        let ks = data.metadata.KeySchema;

        if(indexName) {
            ks = data.metadata.GlobalSecondaryIndexes.filter(ix => ix.IndexName === indexName)[0].KeySchema;
        }

        let pkName = ks[0].AttributeName;
        let skName = ks[1]?.AttributeName;

        const pkAction = skName || indexName ? 'query' : 'get';
        const skAction = indexName ? 'query' : getmode;


        readForm = (<Form  method="post"  >
            <table className="readFormTable">
                <thead></thead><tbody>
            <tr>
                <td className="scanButtonCell">
                        <Link to={path + '/scan'} ><button className="scanButton">SCAN</button>
                        </Link>
                </td>
                <td><span className="pkName">
                    {pkName}
                </span></td>
                <td><input type="text" name="PK" className="pkBox"
                           defaultValue={pk}
                           onChange={handleQuerybox}
                /></td>
                <td>
                    <Link to={path + '/' + pkAction + '/' + encodeURIComponent(pk1)}>
                        <button type="submit">
                            {pkAction.toUpperCase()}
                        </button>
                    </Link>
                </td>

                <td rowSpan="2">&nbsp;</td>

                <td rowSpan="2" className="statsDiv">

                    {stats?.rowCount ? (<div  >{stats.rowCount + ' rows' } <br/>
                        {stats?.ConsumedCapacity} RCU <br/>
                        {stats?.LastEvaluatedKey ? 'LEK : ' + JSON.stringify(stats.LastEvaluatedKey) : null}
                    </div>) : null}
                </td>
            </tr>
            <tr>
                <td></td>
                        <td>{!skName ? null :
                            (<span className="skName">{skName}</span>)}
                        </td>
                        <td>{!skName ? null :
                            (<input type="text" name="SK" className="skBox" defaultValue={sk} onChange={handleGetbox} />)}
                        </td>
                <td>{!skName ? null :
                    <Link to={path + '/' + skAction + '/' + encodeURIComponent(pk1) + '/' + encodeURIComponent(sk1)}>
                        <button type="submit">
                            {skAction.toUpperCase()}
                        </button></Link>}</td>
            </tr>
            </tbody>
            </table>
        </Form>);

    }

    return (
        <div className="menuContainer">

            <ul>
                <li key="1" ><Link className="homeLink" to="/">ddb viz</Link><br/></li>

                <li key="2" className="regionWord" >region: </li>

                {regionList.map((region)=> {
                    let cn;
                    let linkto = "/";
                    if(data?.region === region || regionList.length === 1) {
                        cn = "regionLinkSelected";
                    } else {
                        cn = "regionLink";
                        linkto = "/" + region;
                    }

                    return (
                        <li key={region}>
                            <Link className={cn} to={linkto}>
                                {region}
                            </Link></li>
                    );
                })}

                <li>{tableTitle}</li>
                <li>{readForm}</li>
                <li>{transitionDisplay()}</li>

            </ul>

        </div>
    );
}

