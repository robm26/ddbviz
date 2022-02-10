import {
    Link, NavLink,
    useLoaderData,
    useTransition
} from "remix";

import {config} from "../configuration";

export function Menu() {
    const data = useLoaderData();
    const transition = useTransition();

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

    if(data && data?.region) {
        regionList = [data.region];
    }

    return (
        <div className="menuContainer">

            <ul>
                <li key="1" ><Link className="homeLink" to="/">ddb viz</Link><br/></li>

                <li key="2" className="regionWord" >region: </li>

                {regionList.map((region)=> {
                    let cn;
                    let linkto = "/";
                    if(data?.region === region) {
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
                <li>{transitionDisplay()}</li>
            </ul>

        </div>
    );
}

