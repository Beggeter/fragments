const sum = (n1) => {
    const inner = (n2) => sum(n1 + n2);

    inner[Symbol.toPrimitive] = () => n1;

    return inner;
};
 // 6
 // 12
 // 5