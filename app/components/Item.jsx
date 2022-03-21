import {Link, Form, useLoaderData} from "@remix-run/react";

import {config} from "../configuration";

export const action = async ({request}) => {

    return null;

};


export function Item(props) {
    const data = useLoaderData();

    let region = data.params.region;
    let table = data.params.table;


    let item;
    if(data?.item) {
        item = data.item
    }
    if(data?.items) {
        item = data.items[0];
    }


    const params = data?.params;

    const gsi = props?.gsi; // gsi preview

    if(!item) {
        return (<p>0 items</p>);
    }

    let ks = data.metadata.KeySchema;

    const PkName = ks[0].AttributeName;
    let SkName;

    if(ks.length > 1) {
        SkName = ks[1].AttributeName;
    }


    let gsiProjectedAttrs = [];
    let gsiProjectionType;
    let gsiPreviewPk;
    let gsiPreviewSk;

    if(gsi) { // gsi preview
        const previewGsi = data.metadata.GlobalSecondaryIndexes.filter(item=>item.IndexName === gsi)[0];

        gsiProjectionType = previewGsi?.Projection?.ProjectionType;

        gsiPreviewPk = previewGsi.KeySchema[0].AttributeName;
        gsiProjectedAttrs.push(gsiPreviewPk);

        if(previewGsi.KeySchema.length > 1) {
            gsiPreviewSk = previewGsi.KeySchema[1].AttributeName;
            gsiProjectedAttrs.push(gsiPreviewSk);
        }

        if(gsiProjectionType === 'INCLUDE') {
            const includedAttrs = previewGsi?.Projection?.NonKeyAttributes;
            gsiProjectedAttrs = gsiProjectedAttrs.concat(includedAttrs);


        } else if (gsiProjectionType === 'ALL') {
            gsiProjectedAttrs = [];

        }

    }


    const tableHeaders = (<tr><th>attribute</th><th>value</th></tr>);

    let attrList = Object.keys(item);

    attrList = attrList.filter(item =>  ![PkName, SkName].includes(item));

    attrList.sort(function(a, b){
        // console.log('sort ' + Object.keys(item[a])[0] + ' ' + Object.keys(item[b])[0]);
        const x = item[a][Object.keys(item[a])[0]].length;
        const y = item[b][Object.keys(item[b])[0]].length;

        return x > y ? 1 : -1;
    });

    const rows = (<tbody >
    {
        attrList.map((attr, index)=> {

            const attrVal = item[attr];
            const attrValType = Object.keys(attrVal)[0];

            const attrValue = item[attr][attrValType];

            let style1 = { 'backgroundColor' : 'silver',  'padding':'5px', 'color': 'gray'};  //  attr name
            let style2 = { 'backgroundColor' : 'gainsboro',  'padding':'5px', 'color': 'dimgray', 'wordWrap':'break-word'};  // text value
            let style3 = {};

            let show = true;

            if(gsi) {


                if(
                    (attrList.includes(gsiPreviewPk)
                    && (!gsiPreviewSk || attrList.includes(gsiPreviewSk))
                    && (gsiProjectionType == 'ALL' || gsiProjectedAttrs.includes(attr)))
                    || [PkName, SkName].includes(gsiPreviewPk)
                    || [PkName, SkName].includes(gsiPreviewSk)
                ) {
                    if(gsiPreviewPk === attr) {
                        style2.color = 'darkorchid';
                        style2.fontWeight = 'bold';
                    }

                    if(gsiPreviewSk === attr) {
                        style2.color = 'darkgoldenrod';
                        style2.fontWeight = 'bold';
                    }

                } else {

                    style1.color = 'gainsboro';
                    style2.color = 'gainsboro';
                    style1.backgroundColor = 'whitesmoke';
                    style2.backgroundColor = 'whitesmoke';
                    style3.color = 'gainsboro';
                    style3.backgroundColor = 'whitesmoke';
                    style3.border = '1px solid gainsboro';
                }

            }

            const attrValDisplay = (typeof attrValue === 'object' ?
                (<textarea rows="10" cols="40" style={style3} defaultValue={JSON.stringify(attrValue, null, 2)} />) :
                attrValue);

            return (<tr key={attr}><td style={style1}>{attr}</td><td style={style2}>
                    {attrValDisplay}
                </td>
            </tr>);
        })
    }</tbody>);


    const tab = (<table className="itemTable" >
        <thead>{tableHeaders}</thead>
        {rows}
    </table>);


    return(tab);


}
