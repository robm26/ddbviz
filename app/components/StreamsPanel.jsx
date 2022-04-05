import {Link} from "remix";

export function StreamsPanel(params) {
    const partitionCount = params?.shards?.activeShards?.length;

    return (<div className='shardPanel'>
        <span className='shardCount'>{params?.shards?.activeShards?.length}</span>&nbsp;&nbsp;
        <span className='shardUnits'>active stream shards.</span>
        With {partitionCount} physical storage partitions,
        this table has the potental to handle <b>{partitionCount} thousand write units per second</b>,
        and <b>{partitionCount * 6} thousand default read units per second</b> provided
        traffic is evenly distributed and steady.
        More partitions will be automatically added when you provision capacity at higher levels than this,
        or if On Demand traffic levels pass 50% of this, or if storage grows beyond {partitionCount * 10} GB.

        <ul>
            {params?.shards?.activeShards?.map((shard, index) => {
                return (<li key={index}>{shard}</li>);
            })}
        </ul>
    </div>);

}
