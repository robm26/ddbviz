import {Link, Form, useLoaderData} from "@remix-run/react";


import {config} from "../configuration";

export const action = async ({request}) => {
    // const body = await request.formData();
    return null;
};


export function ItemGrid(props) {
    const data = useLoaderData();

    const items = data.items;

    let region = data.params.region;
    let table = data.params.table;
    const path = '/' + region + '/' + table;

    let tableName = data.params.table;
    let indexName = '';
    const caretPosition = tableName.indexOf("^");
    if(caretPosition >= 0) {
        indexName = tableName.substring(caretPosition + 1);
        tableName = tableName.substring(0, caretPosition);
    }

    const ksBase = data.metadata.KeySchema;

    let ks=ksBase;

    const pkNameBase = ks[0].AttributeName;
    const skNameBase = ks.length > 1 ? ks[1].AttributeName : null;


    if(indexName) {

        ks = data.metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === indexName)[0].KeySchema;

    }

    const PkName = ks[0].AttributeName;
    const SkName = ks.length > 1 ? ks[1].AttributeName : null;

    let collectionNumber = 1;
    let collectionIndex = 1;

    const sortColor1 = 125;
    const sortColor2 = 55;


    let currentPK;
    let prevPK;

    const [displayMode, setDisplayMode] = React.useState('raw');  // schemaless, grid, summary

    const toggleDisplayMode = () => {
        if (displayMode === 'summary') {
            setDisplayMode('raw' );
        } else {

            if(displayMode === 'raw' || displayMode !== 'summary') {
                setDisplayMode('grid');
            } else {
                setDisplayMode('raw' );
            }
        }

    };


    let arrangedItems;
    if(displayMode === 'grid') {
        arrangedItems = makeGrid(items);

    } else {
        arrangedItems = items;
    }

    let tableHeaders;
    if(displayMode === 'raw') {
        tableHeaders = (<tr><th className="pkHeader">{PkName}</th><th className="skHeader">{SkName}</th></tr>);
    } else {

        const tableHeaderVals = Object.keys(arrangedItems[0]).map((attr)=>{
            if(![PkName, SkName].includes(attr)) {
                return(<th key={attr}>{attr}</th>);
            }

        });

        tableHeaders = (<tr>
            <th>{PkName}</th>
            {SkName ? (<th>{SkName}</th>) : null }

            {tableHeaderVals}
        </tr>);

    }

    const rows = arrangedItems.map((item, rowIndex)=> {
        let collectionFinalItem = 0;

        let pkedges = 'middle';

        currentPK = items[rowIndex][PkName]['S'];

        if(rowIndex > 0 ) {
            prevPK = items[rowIndex-1][PkName]['S'];

            if(items[rowIndex][PkName]['S'] !== items[rowIndex-1][PkName]['S']) {
                collectionNumber += 1;
                collectionIndex = 1;
                pkedges = 'first';

            } else {
                collectionIndex += 1;
            }

        } else {
            pkedges = 'first';
            collectionIndex = 1;
        }

        if(rowIndex < items.length - 1) {
            if(items[rowIndex][PkName]['S'] !== items[rowIndex+1][PkName]['S']) {
                pkedges += 'last';
                collectionFinalItem = 1;
            }
        }

        if(rowIndex === items.length - 1) {
            pkedges += 'last';

        }

        let attrList = Object.keys(item); // re-order attributes so PK and SK are first

        if(SkName) {
            const skLocation = attrList.indexOf(SkName);
            if(skLocation > -1) {
                attrList.splice(skLocation, 1);
            }
            attrList.unshift(SkName);
        }

        const pkLocation = attrList.indexOf(PkName);
        if(pkLocation > -1) {
            attrList.splice(pkLocation, 1);
        }
        attrList.unshift(PkName);


        const basePK =  item[pkNameBase][Object.keys(item[pkNameBase])[0]];

        return (<tr key={rowIndex}>
            {attrList.map((attr, cellIndex)=>{

                        let cellValue = item[attr][Object.keys(item[attr])[0]];

                        const displayBytesMax = config().displayBytesMax;

                        let cellDisplay = (typeof cellValue === 'object' ? JSON.stringify(cellValue) : cellValue);

                        let cellMore;

                        if(cellDisplay.length > displayBytesMax) {
                            const remainingBytes = cellDisplay.length - displayBytesMax;
                            cellMore = '... + ' + (remainingBytes > 2048 ? Math.round(remainingBytes/1024) + ' KB'  : remainingBytes + ' bytes');

                            cellDisplay = cellDisplay.substring(0, displayBytesMax);
                        }

                        let cell;

                        if(attr === PkName) {  // the first PK cell

                            const stripe = indexName ? 'gsipk' : 'pk';

                            const pkAction = (SkName || indexName ? 'query' : 'get');


                            cell = (<td key={cellIndex} className="tdPK" pkedges={pkedges} stripe={stripe + collectionNumber%2}>
                                <span >
                                    <Link to={'/' + region + '/' + table + '/' + pkAction + '/' + encodeURIComponent(cellValue)} >
                                        {cellValue}</Link>
                                </span>
                            </td>);

                        } else if (attr === SkName) { // the second SK cell
                            const skStyle = {
                            };
                            skStyle.backgroundColor = sortKeyGradient(collectionIndex, indexName ? sortColor2 : sortColor1);

                            const skAction = (indexName ? 'query' : 'get');

                            cell = (<td key={cellIndex} className="tdSK" skedges={pkedges} style={skStyle} >
                                <span >
                                    <Link to={'/' + region + '/' + table + '/' + skAction + '/' + encodeURIComponent(currentPK) + '/' + encodeURIComponent(cellValue)} >
                                        {cellValue}
                                    </Link>
                                </span>
                            </td>);

                        } else {            // all other cells
                            let cellText;

                            if(typeof cellValue === 'object') {
                                cellText = (<textarea rows="4" cols="25" defaultValue={JSON.stringify(cellValue, null, 2)} />);
                            } else {
                                cellText = (cellMore ? (<>{cellDisplay}<br/>{cellMore}</>) : cellDisplay)
                            }

                            if(indexName && attr === pkNameBase) {
                                cellText = (<Link to={'/' + region + '/' + tableName + '/query/' + encodeURIComponent(cellValue)} className="gsiPkLink">{cellText}</Link>);
                            }
                            if(indexName && attr === skNameBase) {
                                cellText = (<Link to={'/' + region + '/' + tableName + '/get/' + encodeURIComponent(basePK)  + '/' + encodeURIComponent(cellValue)} className="gsiSkLink">{cellText}</Link>);
                            }

                            cell = (<td key={cellIndex} final={collectionFinalItem === 1 ? 'final' : null}>

                                {displayMode === 'grid' ? null : (<span className="cellName">
                                   {attr}
                                </span>)}

                                <span className="cellValue">
                                    {cellText}

                                </span>
                            </td>);

                        }

                        return(cell);

                    }
                )
            }
        </tr>);

    });

    const itemTableControls = (
        <>
            <button onClick={toggleDisplayMode}>{(displayMode === 'grid' ? 'raw' : 'grid').toUpperCase()}</button>
            <button onClick={toggleDisplayMode}>{(displayMode === 'summary' ? 'raw' : 'summary').toUpperCase()}</button>

        </>
    );

    const tab = (
        <div>
            <div className="itemTableControls">
                {itemTableControls}
            </div>
        <table className="itemTable">
            <thead>
            {tableHeaders}
            </thead>
            <tbody>{rows}</tbody>
        </table>
        </div>);

    return (<Form id="itemgridform" method="post" >{tab}</Form>);

}

function makeGrid(items) {

    const attrNames = [];
    const gridItems = [];

    items.map((item, itemIndex)=> {
        let attrList = Object.keys(item);
        attrList.map((attr)=>{
            if(!attrNames.includes(attr)) {
                attrNames.push(attr);
            }
        });

    });

    items.map((item)=> {
        const newItem = {};
        attrNames.map((attr)=> {
            newItem[attr] = attr in item ? item[attr] : '-';
        });
        gridItems.push(newItem);
    });

    return(gridItems);

}


const sortKeyGradient = (index, baseColor) => {
    // const baseColor = 115; // green
    const saturation = 100;
    const startingBrightness = 90;
    const stopAfter = 5;
    const stepSize = 9;

    return HSLToHex(baseColor, saturation, startingBrightness - ((index > stopAfter ? stopAfter : index) * stepSize));

};

const HSLToHex = (h,s,l) => {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length === 1)
        r = "0" + r;
    if (g.length === 1)
        g = "0" + g;
    if (b.length === 1)
        b = "0" + b;

    return "#" + r + g + b;
};
