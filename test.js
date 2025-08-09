const sum = (n1) => {
    const inner = (n2) => sum(n1 + n2);

    inner[Symbol.toPrimitive] = () => n1;

    return inner;
};
console.log(Number(sum(1)(2)(3))) // 6
console.log(Number(sum(2)(4)(4)(2))) // 12
console.log(Number(sum(5))) // 5