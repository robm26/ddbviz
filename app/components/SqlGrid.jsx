
export function SqlGrid(props) {
    const rows = props?.data;

    if(!rows || rows.length === 0) {
        return(null);
    }

    const columnNames = Object.keys(rows[0]);

    const [colClick, setColClick] = React.useState(null);

    let collectionNum = 0;
    let lastKey;

    const sqlGrid = (<div className='sqlTableDiv' >
        <table className='sqlTable'>

        <thead>
            <tr>{columnNames.map((col, indexC)=>{

                return(<th key={indexC} className={col.toLowerCase() === 'type' ? 'sqlType' : null}
                           highlight={colClick===indexC ? 'highlight' : null}
                           onClick={()=> {
                    setColClick((colClick || colClick === 0) && colClick === indexC ? null : indexC);}}>{col}</th>);
            })}</tr>
        </thead>
        <tbody>
            {rows.map((row, indexR)=>{

                if(row?.type && row.type !== lastKey) {
                    collectionNum += 1;
                    lastKey = row.type;
                }

                return(<tr key={indexR} >

                    {Object.keys(row).map((col, indexK)=>{

                        return(<td key={indexK}
                                   highlight={colClick===indexK && (row[col] || row[col] === 0) ? 'highlight': null }
                                   className={row[col] === 0 || row[col] ? 'col-' + collectionNum : 'sqlNull'}
                        >
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
