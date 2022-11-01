// myparser.js
var fs = require("fs");
var jison = require("jison");

var bnf = fs.readFileSync("src/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);

// console.log(parser)

const prog1 = `
class Perro {
    public:
        const var e : int, f : char;
        func sing() : void {
            const var e : int, f : char;
            a = 12;
            if ( ernesto > 12) {
                cobo = 12;
            }
            if ( ernesto > 12) {
                cobo = 12;
                if ( ernesto > 12) {
                    cobo = 10;
                } else if ( ernesto < 10) {
                    const var es : int, fa : char;
                    e = fa + e;
                } else {
                    if ( ernesto > 12) {
                        cobo = 12;
                    }
                    call(cobo);
                }
            }
            return;
        }
};
interface Animal {
    public:
        func sing() : void {
            const var e : int, f : char;
            while ( cobo < 120 || asd() ) {
                asdldaksdj();
                andklakm = 12 + cobo();
                if ( ernesto > 120) {
                    return;
                }
            }
            do {
                asdldaksdj();
                andklakm = 12 + cobo();
                if ( ernesto > 120) {
                    return;
                }
            } while ( cobo < 120 && asd() );

            return;
        }
        const var e : int, f : char;
        func sing() : void {
            const var e : int, f : char;
            return;
        }
    private:
        const var e : int, f : char;
        func sing() : void {
            const var e : int, f : char;
            return;
        }
};
class Gato {
    public:
        const var e : int, f : char;
        func sing() : void {
            const var e : int, f : char;
            return;
        }
};

const var a : int;
func sing() : void {
    const var e : int, f : char;
    return;
}

func sing2(mia : char) : int {
    const var f : string = 3 - f() * 20 + 17 / (12 && (10 < 20) || (1 > 20));
    const var f : int = 3;
    return 2;
    const var f : int;
}

func sing3(mia : char, pia : string) : int {
    const var f : int = 2;
    a = e;
    a = e();
    a = e[1];
    a = e[1][12];
    cobo.a;
    cobo.a(1231, 123981, asdkjhk);
    cobo.a[12];
    cobo.a[12][2332];
    cobo.ernesto.a;
    cobo.ernesto.a(1231, 123981, asdkjhk);
    cobo.ernesto.a[12].a(1231, 123981, asdkjhk);
    cobo.ernesto.a[12][2332].a(1231, 123981, asdkjhk);
    cobo.ernesto.a[12].a[12];
    cobo.ernesto.a[12][2332].a[12];
    return 2;
}

func main () {
    const var e : int;
    return 2;
}
`

const prog2 = `
const var a : int;

func main () {
    const var e : int;
    return 2;
}
`
console.log(parser.generate())

// console.log("PROGRAM 1:\n")
// console.log(prog1)
// console.log("\nResult: " + parser.parse(prog1))
console.log("----------------------------------------------------------------------------------------------------------\n")


module.exports = parser;