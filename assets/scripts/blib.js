/*exports.placeRule = (b) => {
    if(Vars.player == null) return false;
    return Vars.player.team().core().items.has(b.requirements, Vars.state.rules.buildCostMultiplier) || Vars.state.rules.infiniteResources;
};*/
//静态库，全部外用

//importPackage(Packages.mindustry);
// const Vars = Packages.mindustry.Vars;
// global.Vars = Vars;
// module.exports = Vars;

//星球设置区块

//读取我自己的Java class
const urlLoader = Packages.java.net.URLClassLoader([Vars.mods.getMod(modName).file.file().toURI().toURL()], Vars.mods.mainLoader());
exports.getClass = function (name){
    return Packages.rhino.NativeJavaClass(Vars.mods.scripts.scope, urlLoader.loadClass(name));
}
exports.Fx = exports.getClass("ExtraUtilities.content.EUFx");
const EU = exports.getClass("ExtraUtilities.ExtraUtilitiesMod");
const isAps = EU.isAps();
exports.hardMod = Core.settings.getBool("eu-hard-mode") || isAps;
//exports.Blocks = exports.getClass("ExtraUtilities.content.EUBlocks");

exports.setPlanet = function(p, s){
    p.grid = PlanetGrid.create(s);
    p.sectors.ensureCapacity(p.grid.tiles.length);
    for(var i = 0; i < p.grid.tiles.length; i++){
        p.sectors.add(new Sector(p, p.grid.tiles[i]));
    }

    p.sectorApproxRadius = p.sectors.first().tile.v.dst(p.sectors.first().tile.corners[0].v);
}

exports.bulletType = function(type, param){
    var b = type;
    Object.assign(b, 
        param
    )
    return b;
}

exports.moreShootAlternate = function(spread, shots){
    var way = extend(ShootAlternate,{});
    way.spread = spread;
    way.barrels = shots;
    return way;
}

exports.toBullet = function(block, item){
    var key = block.ammoTypes;
    return key.get(item);
}

//炮塔冷却系数，如果第调用时三个参数存在且不为零，就可以设置炮塔的coolantMultiplier
exports.Coolant = function(block, v, coolantMultiplier){
    block.coolant = block.consumeCoolant(v);
    if(coolantMultiplier) block.coolantMultiplier = coolantMultiplier;
}

// exports.getStatus = function (name){
//     return Vars.content.statusEffect(exports.aModName + "-" + name);
// }

//function from abomb4's lib.js
//加载声音
//js用法：lib.loadSound("名字", (s) => {你的方块.声音接口 = s});
exports.loadSound = function (name, setter) {
    const params = new Packages.arc.assets.loaders.SoundLoader.SoundParameter();
    params.loadedCallback = new Packages.arc.assets.AssetLoaderParameters.LoadedCallback({
        finishedLoading(asset, str, cls) {
            // print('1 load sound ' + name + ' from arc');
            setter(asset.get(str, cls));
        }
    });

    Core.assets.load("sounds/" + name, Packages.arc.audio.Sound, params).loaded = new Cons({
        get(a) {
            // print('2 load sound ' + name + ' from arc');
            setter(a);
        }
    });
}


exports.aModName = "extra-utilities";//你mod的名字
exports.mod = Vars.mods.locateMod(exports.aModName);

//104方法写特效，只有lifetime的可以用，有clipsize的还是用new Effect
exports.newEffect = (lifetime, renderer) => new Effect(lifetime, cons(renderer));

exports.cons2 = (func) => new Cons2({
    get: (v1, v2) => func(v1, v2)
});
exports.func = (getter) => new Func({
    get: getter
});

//贴图加载，省去modname
exports.loadRegion = function(name) {
    return Core.atlas.find(exports.aModName + '-' + name, Core.atlas.find("clear"))
}

/**
 * @param {Block} blockType The block type
 * @param {(block: Block) => Building} buildingCreator
 *        A function receives block type, return Building instance;
 *        don't use prov (this function will use prov once)
 */
//直接建立一个新的block
exports.setBuilding = function(blockType, buildingCreator) {
    blockType.buildType = prov(() => buildingCreator(blockType));
}

/**
 * @param {Block} blockType The block type
 * @param {Class<Building>} buildingType The building type
 * @param {Object} overrides Object that as second parameter of extend()
 */
//直接设置buildType
exports.setBuildingSimple = function(blockType, buildingType, overrides) {
    blockType.buildType = prov(() => new JavaAdapter(buildingType, overrides, blockType));
}

/**
 * Get message from bundle.
 * @param {string} type the prefix such as block, unit, mech
 * @param
 */
//快捷获取翻译
exports.getMessage = function(type, key) {
    return Core.bundle.get(type + "." + exports.aModName + "." + key);
}

exports.int = (v) => new java.lang.Integer(v);
///科技树部分
exports.addToResearch = (content, research) => {
    if (!content) {
        throw new Error('content is null!');
    }
    if (!research.parent) {
        throw new Error('research.parent is empty!');
    }
    var researchName = research.parent;
    var customRequirements = research.requirements;
    var objectives = research.objectives;

    var lastNode = TechTree.all.find(boolf(t => t.content == content));
    if (lastNode != null) {
        lastNode.remove();
    }

    var node = new TechTree.TechNode(null, content, customRequirements !== undefined ? customRequirements : content.researchRequirements());
    var currentMod = exports.mod;
    if (objectives) {
        node.objectives.addAll(objectives);
    }

    if (node.parent != null) {
        node.parent.children.remove(node);
    }

    // find parent node.
    var parent = TechTree.all.find(boolf(t => t.content.name.equals(researchName) || t.content.name.equals(currentMod.name + "-" + researchName)));

    if (parent == null) {
        throw new Error("Content '" + researchName + "' isn't in the tech tree, but '" + content.name + "' requires it to be researched.");
    }

    // add this node to the parent
    if (!parent.children.contains(node)) {
        parent.children.add(node);
    }
    // reparent the node
    node.parent = parent;
};

exports.createProbabilitySelector = function() {
    const objects = [];
    const probabilities = [];
    var maxProbabilitySum = 0;

    return {
        showProbabilities() {
            const p = [];
            var previous = 0;
            for (var i = 0; i < probabilities.length; i++) {
                var current = probabilities[i];
                p.push(parseFloat(((current - previous) / maxProbabilitySum).toFixed(5)))
                previous = current;
            }
            return p;
        },
        add(obj, probability) {
            if (!Number.isInteger(probability)) {
                throw "'probability' must integer."
            }
            maxProbabilitySum += probability;
            objects.push(obj);
            probabilities.push(maxProbabilitySum);
        },
        random: function() {
            const random = Math.floor(Math.random() * maxProbabilitySum);
            // Can use binary search
            for (var i = 0; i < probabilities.length; i++) {
                var max = probabilities[i];
                if (random < max) {
                    return objects[i];
                }
            }
            throw "IMPOSSIBLE!!! THIS IS A BUG"
        }
    }
}
//感谢滞人大佬的lib模板