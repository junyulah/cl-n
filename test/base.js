import assert from "assert";
import N from "../index";

describe("base", () => {
    it("base", () => {
        let n = N();
        let f1 = n(function(x, y) {
            return x + y;
        });
        assert.equal(f1(4, 2), 6);
    });

    it("next", () => {
        let n = N();
        let f1 = n(function() {
            return this.next(4);
        });
        let f2 = n(x => x * 2);
        let f3 = n(x => x / 2);

        f1.append(f2, f3);

        assert.equal(f1().join(","), "8,2");
    });

    it("append way", () => {
        let n = N();
        let f1 = n(function() {
            return this.next(4);
        });
        let f2 = n(x => x * 2);
        let f3 = n(x => x / 2);

        f1.append(f2);
        f1.append(f3);

        assert.equal(f1().join(","), "8,2");
    });

    it("fname", () => {
        let n = N();
        let f1 = n(function() {
            return f1.next(4);
        });
        let f2 = n(x => x * 2);
        let f3 = n(x => x / 2);

        f1.append(f2);
        f1.append(f3);

        assert.equal(f1().join(","), "8,2");
    });

    it("this", () => {
        let n = N();
        let f1 = n(function() {
            assert.equal(this, 10);
        }, 10);
        f1();
    });

    it("next deep", () => {
        let n = N();
        let f1 = n(function() {
            return this.next(4);
        }).append(
            n(function(x) {
                return this.next(x - 3);
            }).append(
                x => 2 * x,
                x => x + 1
            ),

            n(function(x) {
                return this.next(x / 2);
            }).append(
                x => 2 * x,
                x => x + 1
            )
        );

        assert.equal(JSON.stringify(f1()), "[[2,2],[4,3]]");
    });
});