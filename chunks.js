var chunkSize = 32;

exports.terrain = {

    prior: [
        0,2,2,3,3,1,3,-1,1,1,1,1,1,1,
    ],
    data: {
        chunks: {},
        gens: {},
    },
    seed: 0,
    init: function(x = 0,y = 0){
        this.data = {
            chunks: {},
            gens: {},
        };
        this.genChunk(x,y);
    },
    setChunk: function(x,y){
        var c = {t: [],g: false,c: false};
        for(var i = 0; i < chunkSize; i++){
            c.t[i] = [];
            for(var j = 0; j < chunkSize; j++){
                c.t[i][j] = {i: 7};//unknown block
            };
        };
        this.data.chunks[x + "," + y] = c;
        console.log("Chunk " + x + " " + y + " set");
        return c;
    },
    genChunk: function(x,y){
        var c,idx,f;
        if(f = !this.data.chunks[idx = x + ',' + y]){
            c = this.setChunk(x,y);
        }else{
            c = this.data.chunks[idx];
        }
        c.g = true;
        for(var i = 0; i < chunkSize; i++){
            for(var j = 0; j < chunkSize; j++){
                c.t[i][j] = {i: Math.random() > 0.0625 ? 0 : 1}
            }
        }
        c.g = true;
        return c;
    },
    getBlock:  function(x,y){
        var px,py,idx;
        if(!x || !y)return {i: 1, u: false};
        if(!(this.data.chunks[idx = (px = Math.floor(x / chunkSize)) + "," + (py = Math.floor(y / chunkSize))] && this.data.chunks[idx].g) )
            this.genChunk(px,py);
        var rx = x % chunkSize, ry = y % chunkSize;
        return this.data.chunks[idx].t[(rx < 0 ? rx + chunkSize : rx)][(ry < 0 ? ry + chunkSize : ry)];
    },
    setBlock: function(x,y,id){
        var px,py,idx,b;
        //if(!(b = this.data.chunks[idx = (px = Math.floor(x / chunkSize)) + "," + (py = Math.floor(y / chunkSize))]) )
        //    b = this.setChunk(px,py);
        b = this.data.chunks[idx = (px = Math.floor(x / chunkSize)) + "," + (py = Math.floor(y / chunkSize))];
        var rx = Math.floor(x % chunkSize), ry = Math.floor(y % chunkSize),bx = (rx < 0 ? rx + chunkSize : rx),by = (ry < 0 ? ry + chunkSize : ry);
        try{
            if(this.prior[b.t[bx][by].i] < this.prior[id])b.t[bx][by] = {i: id};}catch(err){console.log(err); console.log(bx + ", " + by)};
    },
    setBlockU: function(x,y,data){
        if(data)
        if(!data.x || !data.y || data.x !== x || data.y !== y)
            throw new Error('Invalid map position assigment');
        return this.getBlock(x, y).u = data;
    },
    exists: function(x,y){
        return this.data.chunks[x + ',' + y] != undefined
    },
    getChunk: function(x, y){
        var c = (Math.floor(x / chunkSize)) + "," + (Math.floor(y / chunkSize));
        if(!this.data.chunks[c])this.genChunk(Math.floor(x / chunkSize),Math.floor(y / chunkSize));
        return c;
    },
};