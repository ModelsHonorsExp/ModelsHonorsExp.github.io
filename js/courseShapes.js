const GREEN = 2;
const FAIRWAY = 1;
const ROUGH = 0;
game.courseShapes = [new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(23.417,291.318),
    new SAT.Vector(4.115,285.247),
    new SAT.Vector(-6.752,279.656),
    new SAT.Vector(-19.463,268.829),
    new SAT.Vector(-29.843,255.311),
    new SAT.Vector(-37.074,241.324),
    new SAT.Vector(-41.079,231.794),
    new SAT.Vector(-45.653,218.05),
    new SAT.Vector(-51.476,195.373),
    new SAT.Vector(-54.89,173.375),
    new SAT.Vector(-57.376,151.14),
    new SAT.Vector(-58.895,128.905),
    new SAT.Vector(-60,100.317),
    new SAT.Vector(-60,68.828),
    new SAT.Vector(-59.862,47.698),
    new SAT.Vector(-59.171,33.335),
    new SAT.Vector(-57.877,21.354),
    new SAT.Vector(-55.615,9.649),
    new SAT.Vector(-49.987,-6.992),
    new SAT.Vector(-43.289,-18.524),
    new SAT.Vector(-38.353,-24.605),
    new SAT.Vector(-30.903,-31.157),
    new SAT.Vector(-21.813,-36.133),
    new SAT.Vector(-12.111,-39.171),
    new SAT.Vector(-0.751,-40),
    new SAT.Vector(9.192,-38.895),
    new SAT.Vector(19.135,-34.338),
    new SAT.Vector(28.25,-26.051),
    new SAT.Vector(36.399,-15.279),
    new SAT.Vector(45.74,3.404),
    new SAT.Vector(52.143,21.319),
    new SAT.Vector(59.048,45.764),
    new SAT.Vector(66.091,78.357),
    new SAT.Vector(71.063,109.431),
    new SAT.Vector(77.969,166.746),
    new SAT.Vector(66.658,257.207)
]),
new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(74.473,186.367),
    new SAT.Vector(93,186.823),
    new SAT.Vector(103.184,187.93),
    new SAT.Vector(115.879,189.785),
    new SAT.Vector(130.43,192.422),
    new SAT.Vector(144.395,195.742),
    new SAT.Vector(158.457,199.942),
    new SAT.Vector(168.027,203.555),
    new SAT.Vector(178.574,208.438),
    new SAT.Vector(186.484,212.93),
    new SAT.Vector(195.469,219.473),
    new SAT.Vector(202.207,225.918),
    new SAT.Vector(206.895,232.168),
    new SAT.Vector(210.605,238.223),
    new SAT.Vector(213.242,245.547),
    new SAT.Vector(214.805,252.09),
    new SAT.Vector(215.391,259.414),
    new SAT.Vector(215.098,266.739),
    new SAT.Vector(214.023,272.696),
    new SAT.Vector(210.703,281.582),
    new SAT.Vector(205.82,288.907),
    new SAT.Vector(199.219,295.188),
    new SAT.Vector(190.258,300.719),
    new SAT.Vector(180.332,304.629),
    new SAT.Vector(170.078,307.266),
    new SAT.Vector(157.969,309.094),
    new SAT.Vector(144.785,309.903),
    new SAT.Vector(129.941,309.805),
    new SAT.Vector(119.941,309.254),
    new SAT.Vector(110.117,308.438),
    new SAT.Vector(99.331,307.242),
    new SAT.Vector(88.633,305.605),
    new SAT.Vector(63.828,301.211),
    new SAT.Vector(43.711,296.621),
    new SAT.Vector(23.417,291.318)
]),
new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(80.537,179.38),
    new SAT.Vector(92.028,188.484),
    new SAT.Vector(71.522,199.179)
]),
new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(80.537,179.38),
    new SAT.Vector(71.522,199.179),
    new SAT.Vector(77.969,166.746)
])];

game.checkLocation = function(z, x) {
    let posVec = new SAT.Vector(z, x);
    for(let i = 0; i < this.courseShapes.length; i++) {
        if(SAT.pointInPolygon(posVec, this.courseShapes[i])) {
            return FAIRWAY;
        }
    }
    return ROUGH;
}
