import Net from "./net";
import enlace from "./enlace";

let asyncFunction = (f, context) => (...pros) => new Promise((resolve, reject) => {
    let argsPro = Promise.all(pros);
    argsPro.then((args) => {
        let res = f.apply(context, args);
        getValue(res).then((v) => resolve(v));
    }).catch(reject);
});

let getValue = (res) => {
    if (res && typeof res === 'object' &&
        typeof res.then === 'function' &&
        typeof res.catch === 'function') {
        return res;
    } else {
        return Promise.resolve(res);
    }
}

module.exports = (opts = {}) => {
    let net = Net();

    let asyncType = opts.asyncType || false;

    let n = (f, context) => {
        if (typeof f !== "function") {
            throw new TypeError("Expect function");
        }

        let fNode = net.node({
            fun: f,
            context: context
        });

        let newF = (...args) => {
            let ctx = fNode.data.context;
            let fun = fNode.data.fun;
            let res = fun.apply(ctx, args);
            return res;
        };

        // 
        context = context || newF;
        fNode.data.context = context;

        if (asyncType === true) {
            f = asyncFunction(f, context);
            fNode.data.fun = f;
        }

        let followNext = (handler) => (...y) => {
            let gen = enlace();
            let list = null;
            let box = gen.create(fNode, (res) => {
                list = res;
            });
            // pass value to sub nodes
            box.curryNexts(y);
            handler && handler(box, y);
            if (asyncType === true) {
                list = Promise.all(list);
            }
            return list;
        }

        newF.c = newF.append = (...y) => {
            for (let i = 0; i < y.length; i++) {
                let item = getItem(y[i]);
                item = item.getNode();
                fNode.append.call(fNode, item);
            }
            return newF;
        }

        newF.getNode = () => fNode;

        newF.next = followNext((box, y) => {
            box.pass();
        });

        newF.nextForce = followNext((box, y) => {
            box.passForce();
        });

        newF.nextRecursive = followNext((box, y) => {
            box.pass((next) => {
                next.passRecursive();
            });
        });

        newF.nextRecursiveForce = followNext((box, y) => {
            box.passForce((next) => {
                next.passRecursiveForce();
            });
        });

        newF.getClassName = () => {
            return "n";
        }
        return newF;
    }

    n.series = (...y) => {
        let tmp = null;
        for (let i = y.length - 1; i >= 0; i--) {
            let item = y[i];
            if (tmp === null) {
                tmp = getItem(item);
            } else {
                let prev = getItem(item);
                prev.append(tmp);
                tmp = prev;
            }
        }
        return tmp;
    }

    let getItem = (item) => {
        if (typeof item !== "function") {
            throw new Error("Expect n function like n(()=>10)");
        }
        if (!item.getClassName || item.getClassName() !== "n") {
            item = n(item);
        }
        return item;
    }

    return n;
}