// VNode 的种类
// 1、HTML、SVG标签
// 2、组件
//      - 有状态的组件
//          - 普通的有状态组件
//          - 需要被keepAlive的有状态组件
//          - 已经被keepAlive的有状态组件
//      - 函数式组件
// 3、纯文本
// 4、Fragment
// 5、Portal

// 设计VNode对象时，通过flags字段区分种类

// 枚举VNodeFlags
const VNodeFlags = {
    // HTML 标签
    ELEMENT_HTML: 1,
    // SVG 标签
    ELEMENT_SVG: 1 << 1,

    // 普通有状态的组件
    COMPONENT_STATEFUL_NORMAL: 1 << 2,
    // 需要被keepAlive的有状态组件
    COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
    // 已经被keepAlive的有状态组件
    COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
    // 函数式组件
    COMPONENT_FUNCTIONAL: 1 << 5,

    // 纯文本
    TEXT: 1 << 6,
    // Fragment
    FRAGMENT: 1 << 7,
    // Portal
    PORTAL: 1 << 8
}
// 派生出三个额外的标识用于辅助判断
// html和svg都是标签元素，可以用ELEMENT表示
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG
// 普通有状态组件、需要被keepAlive的有状态组件、已经被keepAlive的有状态组件 都是“有状态组件”，可以用COMPONENT_STATEFUL表示
VNodeFlags.COMPONENT_STATEFUL = VNodeFlags.COMPONENT_STATEFUL_NORMAL
    | VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE
    | VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE
// 有状态组件 和 函数式组件都是 “组件”，用COMPONENT表示
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL

export default VNodeFlags
