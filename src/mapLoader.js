const tmx = require("tmx-parser");



async function loadMap() {
    const map = await new Promise((resolve,reject)=>{
        tmx.parseFile('./src/SnowyMapWithTree..tmx', function(err,loadedMap){
            if(err) return  reject(err);
            resolve(loadedMap);
        });
    });
    const layer = map.layers[0];
    const groundTiles = layer.tiles;
    const decalTiles = map.layers[1].tiles;
    const ground2D=[];
    const decals2D = [];
    for (let row = 0; row < map.height; row++) {
        const tileRow = [];
        const decalRow =[];
        for (let col = 0; col < map.width; col++) {
            const tile = groundTiles[row*map.height+col]
            const decalTile = decalTiles[row*map.height+col];
            tileRow.push({id: tile.id, gid: tile.gid});
            if(decalTile){
                decalRow.push({id: decalTile.id, gid: decalTile.gid});
            } else{
                decalRow.push(undefined);
            }
            
        }
        decals2D.push(decalRow);
        ground2D.push(tileRow);
        
    }
    return {ground2D,decals2D};
}
module.exports = loadMap;