const lib = require("blib");
const hardMod = lib.hardMod;

const tiDrill = extend(Drill, "tiDrill", {});
tiDrill.requirements = ItemStack.with(
    Items.copper, 20,
    Items.graphite, 18,
    Items.titanium, 15,
);
tiDrill.buildVisibility = BuildVisibility.shown;
tiDrill.category = Category.production;
tiDrill.drillTime = 340;
tiDrill.size = 2;
tiDrill.tier = 4;
tiDrill.consumeLiquid(Liquids.water, 0.06).boost();
exports.tiDrill = tiDrill;

const defaultData = {color:Items.sand.color, fout:false, rad:4};
const eff1 = new Effect(12, cons(e => {
    let data = e.data ? e.data: defaultData;
    Draw.color(data.color);
    Lines.stroke(3 * e.fout());
    if(data.fout){
        Lines.circle(e.x, e.y, data.rad * e.fout());
    } else {
        Lines.circle(e.x, e.y, data.rad * e.fin());
    }
}));

const shovelBuild = lib.getClass("ExtraUtilities.worlds.forJS.shovel");
const shovel = new shovelBuild("shovel");
shovel.requirements = ItemStack.with(
    Items.metaglass, 60,
    Items.silicon, 130,
    Items.titanium, 80,
);
shovel.buildVisibility = BuildVisibility.shown;
shovel.category = Category.production;
shovel.drillTime = 36 + (hardMod ? 9 : 0);
shovel.size = 3;
shovel.rotateSpeed = 6;
shovel.heatColor = Pal.surge;
shovel.hasPower = true;
shovel.tier = 0;
shovel.updateEffect = Fx.mineBig;
shovel.updateEffectChance = 0.05;
shovel.drillEffect = Fx.none;
shovel.warmupSpeed = 0.02;
shovel.hasLiquids = false;
shovel.liquidBoostIntensity = 1;
shovel.consumePower(2.5);
shovel.buildCostMultiplier = 0.8;
exports.shovel = shovel;

const boof = 2;

const DrawSolidPump = lib.getClass("ExtraUtilities.worlds.blocks.production.DrawSolidPump");
var weBoost = 1.5;
var weItem = Items.graphite;
const weUseTime = 120;
const T2WE = extend(SolidPump, "T2-WE", {
    setStats(){
        this.stats.timePeriod = weUseTime;
        this.super$setStats();
        this.stats.add(Stat.boostEffect, weBoost, StatUnit.timesSpeed);
    },
});
T2WE.buildType = prov(() => {
    var timer = 0;
    return new JavaAdapter(SolidPump.SolidPumpBuild, {
        updateTile(){
            this.efficiency *= this.items.get(weItem) > 0 ? weBoost : 1;
            this.super$updateTile();
            var entity = this;
            if(this.efficiency > 0){
                timer += entity.power.status * entity.delta();
            }
            if(timer >= weUseTime){
                entity.consume();
                timer -= weUseTime;
            }
        },
        // efficiency(){
        //     if(!this.enabled) return 0;
        //     return this.items.get(weItem) > 0 ? weBoost : 1;
        // },
    }, T2WE);
});
//const T2WE = new DrawSolidPump("T2-WE");
T2WE.result = Liquids.water;
//T2WE.consItem = Items.graphite;
T2WE.pumpAmount = 0.3 - (hardMod ? 0.02 : 0);
T2WE.size = 3;
T2WE.liquidCapacity = 60;
T2WE.rotateSpeed = 2;
//T2WE.baseEfficiency = 1;
T2WE.attribute = Attribute.water;
//T2WE.envRequired |= Env.groundWater;
T2WE.consumePower(5);
T2WE.consumeItem(Items.graphite).boost();
T2WE.requirements = ItemStack.with(
    Items.metaglass, 50,
    Items.lead, 85,
    Items.graphite, 75,
    Items.silicon, 75,
    Items.titanium, 70
);
T2WE.buildVisibility = BuildVisibility.shown;
T2WE.category = Category.production;
exports.T2WE = T2WE;

const slagE = extend(SolidPump, "slag-extractor", {});
slagE.result = Liquids.slag;
slagE.pumpAmount = 0.1;
slagE.size = 2;
slagE.liquidCapacity = 30;
slagE.rotateSpeed = 1.4;
slagE.baseEfficiency = 1;
slagE.attribute = Attribute.heat;
slagE.consumePower(2);
slagE.requirements = ItemStack.with(
    Items.metaglass, 40,
    Items.graphite, 35,
    Items.silicon, 25,
    Items.titanium, 25
);
slagE.buildVisibility = BuildVisibility.shown;
slagE.category = Category.production;
exports.slagE = slagE;

const T2CU = extend(AttributeCrafter, "T2CU", {});
T2CU.outputItem = new ItemStack(Items.sporePod, 3);
T2CU.craftTime = 120;
T2CU.size = 3;
T2CU.hasLiquids = true;
T2CU.hasPower = true;
T2CU.hasItems = true;
T2CU.consumePower(1.5);
T2CU.consumeLiquid(Liquids.water, 24/60);
T2CU.drawer = new DrawMulti(
    new DrawRegion("-bottom"),
    new DrawLiquidTile(Liquids.water),
    new DrawDefault(),
    new DrawCultivator(),
    new DrawRegion("-top")
);
T2CU.requirements = ItemStack.with(
    Items.copper, 40,
    Items.graphite, 35,
    Items.silicon, 28,
    Items.titanium, 30
);
T2CU.buildVisibility = BuildVisibility.shown;
T2CU.category = Category.production;
T2CU.envRequired |= Env.spores;
T2CU.attribute = Attribute.spores;
T2CU.legacyReadWarmup = true;
T2CU.maxBoost = 3;
exports.T2CU = T2CU;

const blastOilExtractor = extend(Fracker, "blast-oil-extractor", {});
blastOilExtractor.buildType = prov(() => {
    var x;
    var y;
    return new JavaAdapter(Fracker.FrackerBuild, {
        updateTile(){
            x = this.getX();
            y = this.getY();
            this.super$updateTile();
            if(Mathf.chance(this.delta() * this.block.updateEffectChance) && this.efficiency > 0 && this.typeLiquid() < this.block.liquidCapacity - 0.001){
                var range = Mathf.range(4 * 2);
                var range2 = Mathf.range(4 * 2);
                eff1.at(x + range, y + range2, 0, {color:Items.blastCompound.color, fout:false, rad:12});
                Sounds.explosion.at(x + range, y + range2, Mathf.random(0.7, 1.2));
            }
        },
    }, blastOilExtractor);
});
Object.assign(blastOilExtractor, {
    result : Liquids.oil,
    updateEffect : Fx.pulverize,
    updateEffectChance : 0.04,
    //rotateSpeed : 2,
    liquidCapacity : 100,
    pumpAmount : 1.5,
    size : 4,
    attribute : Attribute.oil,
    baseEfficiency : 0.2,
    itemUseTime : 60,
    buildCostMultiplier : 0.8,
});
blastOilExtractor.consumeItem(Items.blastCompound);
blastOilExtractor.consumePower(6);
blastOilExtractor.consumeLiquid(Liquids.water, 0.5);
blastOilExtractor.requirements = ItemStack.with(
    Items.copper, 220,
    Items.lead, 220,
    Items.thorium, 135,
    Items.silicon, 155,
    Items.plastanium, 125,
    Items.surgeAlloy, 55
);
blastOilExtractor.buildVisibility = BuildVisibility.shown;
blastOilExtractor.category = Category.production;
exports.blastOilExtractor = blastOilExtractor;

const dustExtractor = extend(GenericCrafter, "dust-extractor", {
    setStats(){
        this.super$setStats();
        this.stats.add(Stat.boostEffect, boof, StatUnit.timesSpeed);
    },
});
dustExtractor.buildType = prov(() => {
    const block = dustExtractor;
    var x, y;
    return new JavaAdapter(GenericCrafter.GenericCrafterBuild, {
        updateTile(){
            x = this.getX();
            y = this.getY();
            var boost = this.liquids.get(this.liquids.current()) > 1 ? boof : 1;
            if(this.efficiency > 0){
                this.progress += this.getProgressIncrease(block.craftTime/boost);
                this.totalProgress += this.delta();
                this.warmup = Mathf.approachDelta(this.warmup, 1, block.warmupSpeed);
                if(Mathf.chanceDelta(block.updateEffectChance)){
                    this.block.updateEffect.at(x + Mathf.range(2 * 4), y + Mathf.range(2 * 4));
                }
            }else{
                this.warmup = Mathf.approachDelta(this.warmup, 0, block.warmupSpeed);
            }
            if(this.progress >= 1){
                this.consume();
                if(block.outputItem != null){
                    for(var i = 0; i < block.outputItem.amount; i++){
                        this.offload(block.outputItem.item);
                    }
                }
                for(var i = 0; i < 3; i++){
                    block.craftEffect.at(x, y);
                }
                this.progress %= 1;
            }
            if(block.outputItem != null && this.timer.get(block.timerDump, block.dumpTime / this.timeScale)){
                this.dump(block.outputItem.item);
            }
        },
    }, dustExtractor);
});
Object.assign(dustExtractor, {
    craftTime : 1.6 * 60,
    updateEffect : eff1,
    craftEffect : lib.Fx.absorbEffect,
    updateEffectChance : 0.02,
    size : 2,
    outputItem : new ItemStack(Items.sand, 1),
});
dustExtractor.consumePower(1.2);
dustExtractor.requirements = ItemStack.with(
    Items.copper, 72,
    Items.lead, 50,
    Items.graphite, 40
);
dustExtractor.consumeLiquid(Liquids.water, 0.04).boost();
dustExtractor.buildVisibility = BuildVisibility.shown;
dustExtractor.category = Category.production;
exports.dustExtractor = dustExtractor;
