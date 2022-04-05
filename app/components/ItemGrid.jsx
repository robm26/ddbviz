// Guide// PK, SK cells via {cellValue} on approx lines 327,389// Attribute cells via {cellText} on approx line 524import {Link, Form, useLoaderData} from "@remix-run/react";import {config} from "../configuration";export const action = async ({request}) => {    // const body = await request.formData();    return null;};const sortColor1 = 125;const sortColor2 = 55;let debug = null;export function ItemGrid(props) {    const data = useLoaderData();    const items = data.items;    if(items && items.length === 0) {        return(<p>0 items</p>);    }    const gsi = props?.gsi; // gsi preview    let region = data.params.region;    let table = data.params.table;    const path = '/' + region + '/' + table;    let tableName = data.params.table;    let indexName = '';    const caretPosition = tableName.indexOf("^");    if(caretPosition >= 0) {        indexName = tableName.substring(caretPosition + 1);        tableName = tableName.substring(0, caretPosition);    }    const ksBase = data.metadata.KeySchema;    let ks=ksBase;    const pkNameBase = ks[0].AttributeName;    const skNameBase = ks.length > 1 ? ks[1].AttributeName : null;    if(indexName) {        ks = data.metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === indexName)[0].KeySchema;    }    let gsiProjectedAttrs = [];    let gsiProjectionType;    let gsiPreviewPk;    let gsiPreviewSk;    if(gsi) { // gsi preview        const previewGsi = data.metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === gsi)[0];        gsiProjectionType = previewGsi?.Projection?.ProjectionType;        gsiPreviewPk = previewGsi.KeySchema[0].AttributeName;        gsiProjectedAttrs.push(gsiPreviewPk);        if(previewGsi.KeySchema.length > 1) {            gsiPreviewSk = previewGsi.KeySchema[1].AttributeName;            gsiProjectedAttrs.push(gsiPreviewSk);        }        gsiProjectedAttrs.push(pkNameBase);        if(skNameBase) {            gsiProjectedAttrs.push(skNameBase);        }        if(gsiProjectionType === 'INCLUDE') {            const includedAttrs = previewGsi?.Projection?.NonKeyAttributes;            gsiProjectedAttrs = gsiProjectedAttrs.concat(includedAttrs);        } else if (gsiProjectionType === 'ALL') {            gsiProjectedAttrs = [];        }    }    const PkName = ks[0].AttributeName;    const SkName = ks.length > 1 ? ks[1].AttributeName : null;    const [sortAttr, setSortAttr] = React.useState('collectionIndex');    const [sortDirection, setSortDirection] = React.useState('1');    const sortSorter = (sa) => {        if(sa === sortAttr) {            setSortDirection(sortDirection * -1);        }        setSortAttr(sa);    };    let collectionNumber = 1;    let collectionIndex = 1;    let currentPK;    let prevPK;    const summary = [];    const [displayMode, setDisplayMode] = React.useState('raw');  // schemaless, grid, summary    const toggleDisplayMode = () => {        if(displayMode === 'raw') {            setDisplayMode('grid');        } else {            setDisplayMode('raw');        }    };    const toggleSummary = () => {        if(displayMode === 'raw' || displayMode === 'grid') {            setDisplayMode('summary');        } else {            setDisplayMode('raw');        }    };    let attrList;    function makeGrid(items) {        const attrNames = [];        const gridItems = [];        items.map((item, itemIndex)=> {            let attrList = Object.keys(item);            attrList.map((attr)=>{                if(!attrNames.includes(attr)) {                    attrNames.push(attr);                }            });        });        // console.log('an ' + attrNames);        if(indexName) {   // re-sort attributes so keys appear first            if(skNameBase) {                const baseSkLocation = attrNames.indexOf(skNameBase);                if(baseSkLocation > -1) {                    attrNames.splice(baseSkLocation, 1);                }                attrNames.unshift(skNameBase);            }            const basePkLocation = attrNames.indexOf(pkNameBase);            if(basePkLocation > -1) {                attrNames.splice(basePkLocation, 1);            }            attrNames.unshift(pkNameBase);        }        if(SkName) {            const skLocation = attrNames.indexOf(SkName);            if(skLocation > -1) {                attrNames.splice(skLocation, 1);            }            attrNames.unshift(SkName);        }        items.map((item)=> {            const newItem = {};            attrNames.map((attr)=> {                newItem[attr] = attr in item ? item[attr] : '';            });            gridItems.push(newItem);        });        return(gridItems);    }    let arrangedItems;    if(displayMode === 'grid') {        arrangedItems = makeGrid(items);    } else if(displayMode === 'raw' || displayMode === 'summary') {        arrangedItems = items;    }    let tableHeaders;    if(displayMode === 'raw') {        tableHeaders = (<tr>            <th >{PkName}</th><th >{SkName}</th>            {debug ? (<th>debug: {debug}</th>) : null}        </tr>);    } else if(displayMode === 'grid') {        const tableHeaderVals = Object.keys(arrangedItems[0]).map((attr)=>{            if(![PkName, SkName].includes(attr)) {                return(<th key={attr}>{attr}</th>);            }        });        tableHeaders = (<tr><th>{PkName}</th>{SkName ? (<th>{SkName}</th>) : null }            {tableHeaderVals}        </tr>);    } else {                          // summary        tableHeaders = (<tr>            <th><button onClick={()=>{sortSorter('pk')}}>{PkName}</button></th>            {!SkName ? null : (<th><button onClick={()=>{sortSorter('skMin')}}>{SkName} min</button></th>)}            {!SkName ? null : (<th><button onClick={()=>{sortSorter('skMax')}}>{SkName} max</button></th>)}            <th><button onClick={()=>{sortSorter('collectionIndex')}}>item count</button></th>        </tr>);    }    let skMin = '';    let skMax = '';    let rowCount = 0;    let pkCount = 0;    const rows = arrangedItems?.map((item, rowIndex)=> {        rowCount = rowIndex;        attrList = Object.keys(item);        let collectionFinalItem = 0;        let pkedges = 'middle';        let currentPK = items[rowIndex][PkName][Object.keys(items[rowIndex][PkName])[0]];        const PkType = Object.keys(items[rowIndex][PkName])[0];        if(rowIndex > 0 ) {            prevPK = items[rowIndex-1][PkName][PkType];            if(items[rowIndex][PkName][PkType] !== items[rowIndex-1][PkName][PkType]) {                pkCount += 1;                collectionNumber += 1;                collectionIndex = 1;                pkedges = 'first';            } else {                collectionIndex += 1;            }        } else {            pkedges = 'first';            collectionIndex = 1;        }        if(rowIndex < items.length - 1) {            if(items[rowIndex][PkName][PkType] !== items[rowIndex+1][PkName][PkType]) {                pkedges += 'last';                collectionFinalItem = 1;            }        }        if(rowIndex === items.length - 1) {            pkedges += 'last';            collectionFinalItem = 1;        }        if(indexName) {   // re-sort attributes so keys appear first            if(skNameBase) {                const baseSkLocation = attrList.indexOf(skNameBase);                if(baseSkLocation > -1) {                    attrList.splice(baseSkLocation, 1);                }                attrList.unshift(skNameBase);            }            const basePkLocation = attrList.indexOf(pkNameBase);            if(basePkLocation > -1) {                attrList.splice(basePkLocation, 1);            }            attrList.unshift(pkNameBase);        }        if(SkName) {            const skLocation = attrList.indexOf(SkName);            if(skLocation > -1) {                attrList.splice(skLocation, 1);            }            attrList.unshift(SkName);        }        const pkLocation = attrList.indexOf(PkName);        if(pkLocation > -1) {            attrList.splice(pkLocation, 1);        }        attrList.unshift(PkName);        const basePK =  item[pkNameBase][Object.keys(item[pkNameBase])[0]];        let pkValue;        let cn;        let cn2;        let valueBig = false;        let valueHuge = false;        const tableRow = (<tr key={rowIndex}>            {attrList.map((attr, cellIndex)=>{                    let cellValue = item[attr][Object.keys(item[attr])[0]];                    if(!cellValue) {                        cellValue = '';                    }                    const displayBytesMax = config().displayBytesMax;                    valueBig = false;                    valueHuge = false;                    let cellDisplay = (typeof cellValue === 'object' ? JSON.stringify(cellValue) : cellValue);                    let cellMore;                    if(cellDisplay.length > displayBytesMax) {                        const remainingBytes = cellDisplay.length - displayBytesMax;                        cellMore = '... + ' + (remainingBytes > 2048 ? Math.round(remainingBytes/1024) + ' KB'  : remainingBytes + ' bytes');                        cellDisplay = cellDisplay.substring(0, displayBytesMax);                    }                    if(cellValue.length > config().gridFormatting?.valueBig) {                        if(cellValue.length > config().gridFormatting?.valueHuge) {                            valueHuge = true;                        } else {                            valueBig = true;                        }                    }                    let cell;                    if(attr === PkName) {  // ********************* the first PK cell                        pkValue = cellValue;                        const stripe = indexName ? 'gsipk' : 'pk';                        const pkAction = (SkName || indexName ? 'query' : 'get');                        cn = 'tdPK';                        if(gsi && !indexName) {   // gsi hover, style table keys                            if(gsiPreviewPk === PkName) {                                cn='tdPKgsiPK';                            }                            if(gsiPreviewSk === PkName) {                                cn='tdPKgsiSK';                            }                            if(!attrList.includes(gsiPreviewPk) || (item[gsiPreviewPk].length === 0)) {                                cn='tdPKhidden';                            }                            if(gsiPreviewSk && (!attrList.includes(gsiPreviewSk) || (item[gsiPreviewSk].length === 0)) ) {                                cn='tdPKhidden';                            }                        }                        cell = (<td key={cellIndex}                                    className={cn}                                    pkedges={pkedges}                                    stripe={stripe + collectionNumber%2}                        >                            <Link to={'/' + region + '/' + table + '/' + pkAction + '/' + encodeURIComponent(cellValue)}>                            {cellValue}                           </Link>                        </td>);                    } else if (attr === SkName) { // // *********************  the second SK cell                        if(displayMode === 'summary') {                            if(collectionIndex === 1) {                                skMin = cellValue;                                skMax = cellValue;                            } else {                                if(cellValue < skMin) {                                    skMin = cellValue;                                }                                if(cellValue > skMax) {                                    skMax = cellValue;                                }                            }                            cell = null;                        } else {                            cn2 = 'tdSK';                            if(gsi && !indexName) {   // gsi hover, style table keys                                if (gsiPreviewPk === SkName) {                                    cn2 = 'tdSKgsiPK';                                }                                if (gsiPreviewSk === SkName) {                                    cn2 = 'tdSKgsiSK';                                }                                if (gsiPreviewSk && (!attrList.includes(gsiPreviewSk) || (item[gsiPreviewSk].length === 0)) ) {                                    cn2 = 'tdSKhidden';                                }                                if (!attrList.includes(gsiPreviewPk) || (item[gsiPreviewPk].length === 0)) {                                    cn2 = 'tdSKhidden';                                }                            }                            const skStyle = {};                            skStyle.backgroundColor = sortKeyGradient(collectionIndex, indexName ? sortColor2 : sortColor1);                            const skAction = (indexName ? 'query' : 'get');                            cell = (<td key={cellIndex}                                        className={cn2}                                        style={skStyle}                                        >                                <span >                                    <Link to={'/' + region + '/' + table + '/' + skAction + '/' + encodeURIComponent(currentPK) + '/' + encodeURIComponent(cellValue)} >                                        {cellValue}                                    </Link>                                </span>                            </td>);                        }                    } else {                                                  // **********************************************  all other cells                        if(displayMode === 'summary') {                            cell = null;                        } else {                            let style1 = { 'backgroundColor' : 'gainsboro',  'padding':'4px'};  // whole cell (text value)                            let style2 = { 'backgroundColor':'lightgrey', 'color':'#aaa', 'padding':'4px'}; // label div                            let style3 = {'color':'dimgray','marginTop':'3px', 'padding' : '2px'};   // label text                            let style4 = { };                            let show = true;                            let gsiPreviewPkValue;                            if(gsiPreviewPk) {                                if(item[gsiPreviewPk]) {                                    gsiPreviewPkValue = item[gsiPreviewPk][Object.keys(item[gsiPreviewPk])[0]];                                }                                if(gsiPreviewSk && (!attrList.includes(gsiPreviewSk) || item[gsiPreviewSk].length === 0 ) ) {                                    show = false;                                }                                if(Object.keys(item).includes(gsiPreviewPk) && item[gsiPreviewPk].length === 0) {                                    show = false;                                }                                if(gsiProjectedAttrs && ( (!gsiProjectedAttrs.includes(attr) ) && gsiPreviewPk != attr  && gsiPreviewSk != attr)  )  {                                    show = false;                                }                                if(cn === 'tdPKhidden') {                                    show = false;                                }                                if(gsiProjectionType === 'ALL') {                                    show = true;                                }                                if(typeof item[gsiPreviewPk] === 'string' && item[gsiPreviewPk].length === 0 ) {                                    show = false;                                }                                if(gsiPreviewSk) {                                    if(typeof item[gsiPreviewSk] === 'string' && item[gsiPreviewSk].length === 0 ) {                                        show = false;                                    }                                    if(!attrList.includes(gsiPreviewSk)) {                                        show = false;                                    }                                }                                if(attrList.includes(gsiPreviewPk) && show ) {                                    style1.backgroundColor = 'gainsboro';                                } else {                                    style1.backgroundColor ='whitesmoke'; // *** hidden cell                                    style2.color = 'lightgrey';                                    style2.backgroundColor ='#EEEEEE';                                    style3.color = 'gainsboro';                                    style4.border = '1px solid gainsboro';                                    style4.backgroundColor = 'whitesmoke';                                    style4.color = 'gainsboro';                                }                            }                            if(gsiPreviewPk === attr && (!gsiPreviewSk || item[gsiPreviewSk])) {                                style3.color = 'darkorchid';                                style3.fontWeight = 'bold';                            }                            if(gsiPreviewSk === attr && attrList.includes(gsiPreviewPk) && show) {                                style3.color = 'darkgoldenrod';                                style3.fontWeight = 'bold';                            }                            if(collectionFinalItem === 1 && data?.params?.action === 'scan') {                                style1.borderBottom = '2px dashed dimgray';                            }                            if(!gsiPreviewPk || attrList.includes(gsiPreviewPk) && show ) {                                if(!gsiPreviewSk || attrList.includes(gsiPreviewSk)) {                                    if(valueBig && show) {                                        style1.backgroundColor = 'mistyrose';                                    }                                    if(valueHuge && show) {                                        style1.backgroundColor = 'pink';                                    }                                }                            }                            let cellText;                            if(typeof cellValue === 'object') {                                cellText = (<textarea rows="3" cols="25"                                                      defaultValue={JSON.stringify(cellValue, null, 2)}                                                      style={style4}                                />);                            } else {                                cellText = (cellMore ? (<>{cellDisplay}<br/>{cellMore}</>) : cellDisplay)                            }                            if(!cellText || cellText.length === 0) {                                style1.backgroundColor = 'whitesmoke';                            }                            if(indexName && attr === pkNameBase) {                                cellText = (<Link to={'/' + region + '/' + tableName + '/query/' + encodeURIComponent(cellValue)} className="gsiPkLink">{cellText}</Link>);                            }                            if(indexName && attr === skNameBase) {                                cellText = (<Link to={'/' + region + '/' + tableName + '/get/' + encodeURIComponent(basePK)  + '/' + encodeURIComponent(cellValue)} className="gsiSkLink">{cellText}</Link>);                            }                            if(gsi && attr === gsiPreviewPk) {                                cellText = (<Link to={'/' + region + '/' + tableName + '^' + gsi + '/query/' + encodeURIComponent(cellValue)} >{cellText}</Link>);                            }                            if(gsi && attr === gsiPreviewSk) {                                cellText = (<Link to={'/' + region + '/' + tableName + '^' + gsi + '/query/' + encodeURIComponent(gsiPreviewPkValue) + '/' + cellValue} >{cellText} </Link>);                            }                            cell = (<td key={cellIndex}                                        // final={collectionFinalItem === 1 ? 'final' : null}                                        datastripe={'ds' + collectionNumber%2}                                        style={style1}                            >                                {displayMode === 'grid' ? null : (<div style={style2} >                                       {attr}                                    </div>)}                                <div style={style3}>                                    {/*<Link to={} >*/}                                        {cellText}                                    {/*</Link>*/}                                </div>                            </td>);                        }                    }                    return(cell);                }            )            }        </tr>);        if(displayMode === 'summary' && collectionFinalItem !== 1) {            return null;        }        summary.push({pk:pkValue, skMin:skMin, skMax:skMax,collectionIndex:collectionIndex});        return tableRow;    });    let statsPanel;    if(displayMode === 'summary') {        statsPanel = (<table className="statsTable"><tbody>        <tr><td className='statsTableHeader'>Collections</td>            <td className='statsTableData'>{pkCount + 1}</td></tr>        <tr><td className='statsTableHeader'>Items</td>            <td className='statsTableData'>{rowCount + 1}</td></tr>        </tbody></table>);    }    let displayRows;    if(displayMode === 'summary') {        displayRows = columnSorted(summary, region, table, indexName, sortAttr, sortDirection);    } else {        displayRows = rows;    }    const itemTableControls = (        <>            <button onClick={toggleDisplayMode}>{(displayMode === 'grid' ? 'raw' : 'grid').toUpperCase()}</button>            {data?.params?.action === 'scan' && (SkName || indexName) ? (                <button onClick={toggleSummary}>{(displayMode === 'summary' ? 'raw' : 'summary').toUpperCase()}</button>            ) : null}        </>    );    const tab = (        <div>            <div className="itemTableControls">                {itemTableControls}            </div>            <div className="itemTableDiv">                {statsPanel}                <table className="itemTable">                    <thead>                    {tableHeaders}                    </thead>                    <tbody>{displayRows}</tbody>                </table>            </div>        </div>);    return (<Form id="itemgridform" method="post" >{tab}</Form>);}function columnSorted(items, region, table, indexName, sortAttr, sortDirection) {    let sortedRows = [...items];    sortedRows.sort((a,b)=> {        const x = typeof a[sortAttr] === 'string' ? a[sortAttr].toUpperCase() : a[sortAttr];        const y = typeof b[sortAttr] === 'string' ? b[sortAttr].toUpperCase() : b[sortAttr];        if (x > y) {return -1 * sortDirection;}        if (x < y) {return 1 * sortDirection;}        return 0;    });    let maxItemCount = 0;    sortedRows.map((row)=>{        if(row?.collectionIndex > maxItemCount) {            maxItemCount = row?.collectionIndex;        }    });    const rows = sortedRows.map((item, itemIndex)=>{        const skStyle = {};        skStyle.backgroundColor = sortKeyGradient(1, indexName ? sortColor2 : sortColor1);        skStyle.padding = '8px';        const skStyle2 = {};        skStyle2.backgroundColor = sortKeyGradient(2, indexName ? sortColor2 : sortColor1);        skStyle2.padding = '8px';        const stripeHeader = indexName ? 'gsipk' : 'pk';        const SizeRatio = Math.round(100 * item.collectionIndex / maxItemCount)/100;        const cssBar = 'linear-gradient(90deg, silver ' + SizeRatio*100 + '%, gainsboro ' + (SizeRatio)*100 + '%)';        const sizeBarDiv = (<div style={{            'color': 'dimgray' ,            'height' : '100%',            'display' : 'block',            'width' : '200px',            'margin' : '2px',            'padding' : '2px',            'background': cssBar}}>            {item.collectionIndex}        </div>);        return(<tr key={itemIndex}>            <td className="tdPK" stripe={stripeHeader + (itemIndex%2 === 0 ? '1' : '0')} pkedges="firstlast">                <Link to={'/' + region + '/' + table + '/query/' + encodeURIComponent(item.pk)}>                        {item.pk}                    </Link>            </td>            {!item.skMin ? null : (                <td style={skStyle} className='tdSKgsi'>                    <Link to={'/' + region + '/' + table + '/get/' + encodeURIComponent(item.pk) + '/' + item.skMin}>                        {item.skMin}</Link>                </td>            ) }            {!item.skMax ? null : (                <td style={skStyle2} className='tdSKgsi'>                    <Link to={'/' + region + '/' + table + '/get/' + encodeURIComponent(item.pk) + '/' + item.skMax}>                        {item.skMax}</Link>                </td>            ) }            <td className="collSize" >                {sizeBarDiv}            </td>        </tr>);    });    return(rows);}const sortKeyGradient = (index, baseColor) => {    // const baseColor = 115; // green    const saturation = 100;    const startingBrightness = 90;    const stopAfter = 4;    const stepSize = 9;    return HSLToHex(baseColor, saturation, startingBrightness - ((index > stopAfter ? stopAfter : index) * stepSize));};const HSLToHex = (h,s,l) => {    s /= 100;    l /= 100;    let c = (1 - Math.abs(2 * l - 1)) * s,        x = c * (1 - Math.abs((h / 60) % 2 - 1)),        m = l - c/2,        r = 0,        g = 0,        b = 0;    if (0 <= h && h < 60) {        r = c; g = x; b = 0;    } else if (60 <= h && h < 120) {        r = x; g = c; b = 0;    } else if (120 <= h && h < 180) {        r = 0; g = c; b = x;    } else if (180 <= h && h < 240) {        r = 0; g = x; b = c;    } else if (240 <= h && h < 300) {        r = x; g = 0; b = c;    } else if (300 <= h && h < 360) {        r = c; g = 0; b = x;    }    // Having obtained RGB, convert channels to hex    r = Math.round((r + m) * 255).toString(16);    g = Math.round((g + m) * 255).toString(16);    b = Math.round((b + m) * 255).toString(16);    // Prepend 0s, if necessary    if (r.length === 1)        r = "0" + r;    if (g.length === 1)        g = "0" + g;    if (b.length === 1)        b = "0" + b;    return "#" + r + g + b;};