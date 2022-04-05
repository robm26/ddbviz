
export function SqlGrid(props) {
    const rows = props?.data;

    if(!rows || rows.length === 0) {
        return(null);
    }

    const columnNames = Object.keys(rows[0]);

    const [colClick, setColClick] = React.useState(null);


    const sqlGrid = (<div className='sqlTableDiv' >
        <table className='sqlTable'>
        {/*<colgroup>*/}
        {/*    {columnNames.map((col, idx)=>{*/}
        {/*        return (<col col={idx} key={idx}/>);*/}
        {/*    })}*/}
        {/*</colgroup>*/}

        <thead>
            <tr>{columnNames.map((col, indexC)=>{
                return(<th key={indexC}
                           highlight={colClick===indexC ? 'highlight' : null}
                           onClick={()=> {
                    setColClick(colClick && colClick === indexC ? null : indexC);}}>{col}</th>);
            })}</tr>
        </thead>
        <tbody>
        {rows.map((row, indexR)=>{
            return(<tr key={indexR}>
                {Object.keys(row).map((col, indexK)=>{
                    return(<td key={indexK} highlight={colClick===indexK && (row[col] || row[col] === 0) ? 'highlight': null } className={row[col] === 0 || row[col] ? null : 'sqlNull'}>
                        {row[col]}
                    </td>);
                })}
            </tr>);
        })}

        </tbody>
    </table>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>&nbsp;
    </div>);

    // return(<div>
    //     {tableGrid}
    // </div>);
    return(sqlGrid);

}
