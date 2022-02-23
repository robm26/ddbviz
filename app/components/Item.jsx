import {Link, Form, useLoaderData} from "@remix-run/react";

import {config} from "../configuration";

export const action = async ({request}) => {

    return null;

};


export function Item(props) {
    const data = useLoaderData();

    let region = data.params.region;
    let table = data.params.table;


    const item = data?.item;
    const params = data?.params;

    if(!item) {
        return (<p>0 items</p>);
    }

    let ks = data.metadata.KeySchema;

    const PkName = ks[0].AttributeName;
    let SkName;

    if(ks.length > 1) {
        SkName = ks[1].AttributeName;
    }

    const tableHeaders = (<tr><th>attribute</th><th>value</th></tr>);

    let attrList = Object.keys(item);

    attrList = attrList.filter(item =>  ![PkName, SkName].includes(item));

    attrList.sort(function(a, b){
        // console.log('sort ' + Object.keys(item[a])[0] + ' ' + Object.keys(item[b])[0]);
        const x = Object.keys(item[a])[0];
        const y = Object.keys(item[b])[0];

        return x < y ? 1 : -1;
    });

    const rows = (<tbody >{
        attrList.map((attr)=> {

            const attrVal = item[attr];
            const attrValType = Object.keys(attrVal)[0];

            const attrValue = item[attr][attrValType];

            const attrValDisplay = (typeof attrValue === 'object' ? (<textarea rows="10" cols="40" defaultValue={JSON.stringify(attrValue, null, 2)} />) : attrValue);

            return (<tr key={attr}>
                <td className="itemAttrName">{attr}</td>
                <td className="itemAttrValue">{attrValDisplay}</td>
            </tr>);
        })
    }</tbody>);


    const tab = (<table className="itemTable" suppressHydrationWarning>
        <thead>{tableHeaders}</thead>
        {rows}
    </table>);


    return(tab);


}
