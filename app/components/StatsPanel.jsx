import {Link, Form, useLoaderData, useSearchParams} from "remix";

import { Chart as ChartJS,
    ArcElement,
    LineElement,
    BarElement,
    PointElement,
    BarController,
    BubbleController,
    DoughnutController,
    LineController,
    PieController,
    PolarAreaController,
    RadarController,
    ScatterController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip,
    SubTitle} from 'chart.js';
import { Line } from 'react-chartjs-2';



export function StatsPanel(params) {

    const data = useLoaderData();

    ChartJS.register(
        ArcElement,
        LineElement,
        BarElement,
        PointElement,
        BarController,
        BubbleController,
        DoughnutController,
        LineController,
        PieController,
        PolarAreaController,
        RadarController,
        ScatterController,
        CategoryScale,
        LinearScale,
        LogarithmicScale,
        RadialLinearScale,
        TimeScale,
        TimeSeriesScale,
        Decimation,
        Filler,
        Legend,
        Title,
        Tooltip,
        SubTitle
    );

    const path = '/' + params.region + '/' + params.table;

    const [minutesBack, setMinutesBack] = React.useState(data?.minutesBack ? data?.minutesBack : 20);

    const handleMinutesBox = (val) => {
        setMinutesBack(val.target.value);
    };
    const stats = typeof data?.stats?.MetricDataResults === 'object' ? data.stats.MetricDataResults : null;

    const statsCount = stats?.length;

    let label;



    let tables;

    let chartData = {};

    const formatDate = (str, format) => {
        if(format === 1) {
            return str.slice(0,16);
        }
        if(format === 2) {
            // console.log(str.slice(11,11));
            return str.slice(11,16);
        }

    }
    console.log('statsCount: ', statsCount);

    if(statsCount > 0) {


        chartData.labels = stats[0].Timestamps.reverse().map(dt=>formatDate(dt,2));

        chartData.datasets = [];

        let lineColors = ['orchid', 'dodgerblue', 'lime', 'goldenrod'];

        tables = stats.map((stat, index) => {

            let label = stat['Label'];
            let timestamps = stat['Timestamps'].map((statrow) => {
                return formatDate(statrow, 1)
            });
            let values = stat['Values'];

            chartData.datasets.push({
                label: label,
                data: stat['Values'].reverse(),
                tension: 0.2,
                borderColor: lineColors[index],
                fill: true
            });

            return (<table className="statsRawTable" key={index}>
                <thead><tr><th colSpan={2}>{label}</th></tr></thead>
                <tbody>
                    {timestamps.map((ts, index) => {
                        return (<tr key={index}>
                            <td>{ts}</td>
                            <td>{values[index]}</td>
                        </tr>);
                    })}
                </tbody>
            </table>);


        });

    }

    // const timestamps = stats[0]?.Timestamps;
    // const values = stats[0]?.Values;


    // let labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
    // let chartData = {
    //     labels: labels,
    //     datasets: [{
    //         label: 'My First Dataset',
    //         data: [65, 59, 80, 81, 56, 55, 40],
    //         fill: true,
    //         borderColor: 'rgb(75, 192, 192)',
    //         tension: 0.1
    //     }]
    // };



    const panel = (<div className="cwForm">
        <Form  method="post"  >
            <div>Minutes back: &nbsp;
                <input className="minutesBack"
                       type="text"
                       onChange={handleMinutesBox}
                       defaultValue={minutesBack}/>
                &nbsp;&nbsp;&nbsp;
                <Link to={path + '/stats?minutesBack=' + minutesBack }>
                    <button type="submit" className="minutesBackButton">GATHER STATS</button>
                </Link>
                &nbsp;&nbsp;
                <span>{label}</span>

                {!statsCount || statsCount === 0 ? null : (
                    <div className="chart">
                        <Line data={chartData} />
                    </div>
                )}

                <div>
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


