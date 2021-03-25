// 一个标签的子节点
// - 没有子节点
// - 只有一个子节点
// - 多个子节点
//      - 有key
//      - 无key
// - 不知道子节点的情况

// 枚举子节点ChildrenFlags
const ChildrenFlags = {
    // 未知的 children 类型
    UNKNOWN_CHILDREN: 0,
    // 没有 children
    NO_CHILDREN: 1,
    // children 是单个VNode
    SINGLE_VNODE: 1 << 1,

    // children 是多个拥有key的VNode
    KEYED_VNODES: 1 << 2,
    // children 是多个没有key的VNode
    NODE_KEYED_VNODES: 1 << 3
}
// 派生出一个“多节点”标识
// 判断一个VNode的子节点是否是多个子节点 ： someVNode.childFlags & ChildrenFlags.MULTIPLE_VNODES
ChildrenFlags.MULTIPLE_VNODES = ChildrenFlags.KEYED_VNODES | ChildrenFlags.NODE_KEYED_VNODES

export default ChildrenFlags
