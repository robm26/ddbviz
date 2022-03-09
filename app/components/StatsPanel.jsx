import {Link, Form, useLoaderData, useSearchParams} from "remix";


export function StatsPanel(params) {

    const data = useLoaderData();

    const path = '/' + params.region + '/' + params.table;

    const [minutesBack, setMinutesBack] = React.useState(data?.minutesBack ? data?.minutesBack : 30);

    const handleMinutesBox = (val) => {
        setMinutesBack(val.target.value);
    };
    const stats = typeof data?.stats?.MetricDataResults === 'object' ? data.stats.MetricDataResults : null;

    const statsCount = stats?.length;

    let label;



    let tables;

    if(statsCount > 0) {

        tables = stats.map((stat, index) => {


            let label = stat['Label'];
            let timestamps = stat['Timestamps'];
            let values = stat['Values'];


            return (<table className="statsRawTable" key={index}>
                <thead><tr><th colSpan={2}>{label}</th></tr></thead>
                <tbody>
                    {timestamps.map((ts, index) => {
                        return (<tr key={index}>
                            <td>{ts.substring(1,20)}</td>
                            <td>{values[index]}</td>
                        </tr>);
                    })}
                </tbody>
            </table>);


        });


    }


    // const timestamps = stats[0]?.Timestamps;
    // const values = stats[0]?.Values;

    const panel = (<div className="cwForm">
        <Form  method="post"  >
            <div>Minutes back: &nbsp;
                <input className="minutesBack"
                       type="text"
                       onChange={handleMinutesBox}
                       defaultValue={minutesBack}/>
                &nbsp;&nbsp;&nbsp;
                <Link to={path + '/stats?minutesBack=' + minutesBack }>
                    <button type="submit" className="minutesBackButton">gather stats</button>
                </Link>
                &nbsp;&nbsp;
                <span>{label}</span>

                <div>



                    {/*<div>{data.stats?.MetricDataResults?.length} stats: {data.stats?.MetricDataResults.map((metric)=> {*/}
                    {/*    return (metric?.Label + ' ');*/}
                    {/*})}</div>*/}

                    {/*{timestamps.length} data points<br/>*/}
                    {tables}



                </div>
            </div>
        </Form>

    </div>);

    return panel;

}

const StatsChartPanel = (stats) => {

    return (<p>stats<br/>chart here</p>);

}


