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

// 唯一标识 Fragment 无外层div
const Fragment = Symbol()
// 唯一标识 Portal 挂载点不确定(dialog)
const Portal = Symbol()

/**
 * 辅助创建VNode的h函数
 * @param tag
 * @param data
 * @param children
 */
function h(tag, data = null, children = null) {
    let flags = null
    if (typeof tag === 'string') {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
    } else if (tag === Fragment) {
        flags = VNodeFlags.FRAGMENT
    } else if (tag === Portal) {
        flags = VNodeFlags.PORTAL
        // Portal 类型的VNode的tag属性值储存的是Portal的挂载目标
        tag = data && data.target
    } else {
        // 兼容 vue2 的对象式组件
        // vue2 中用一个对象做为组件描述，通过检查functional属性来判断是否为函数式组件
        if (tag !== null && typeof tag === 'object') {
            flags = tag.functional
                ? VNodeFlags.COMPONENT_FUNCTIONAL       // 函数式组件
                : VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
        } else if (typeof tag === 'function') {
            // vue3 的类组件
            // vue3 中，有状态组件是继承了基类的类，所以通过原型链判断是否有render函数来确定是否为函数式组件
            flags = tag.prototype && tag.prototype.render
                ? VNodeFlags.COMPONENT_STATEFUL_NORMAL  // 有状态组件
                : VNodeFlags.COMPONENT_FUNCTIONAL       // 函数式组件
        }
    }

    // 仅限与非组件类型的VNode
    // 因为对于组件类型的VNode来说，它并没有子节点，所有的子节点都应做为slots存在，
    // 所以如果使用h函数创建一个组件类型的VNode,应该把children的内容转化为slots，然后再把children置为null
    let childFlags = null
    if (Array.isArray(children)) {
        const { length } = children
        if (length === 0) {
            // 没有children
            childFlags = ChildrenFlags.NO_CHILDREN
        } else if (length === 1) {
            // 单个子节点
            childFlags = ChildrenFlags.SINGLE_VNODE
            children = children[0]
        } else {
            // 多个子节点,且子节点使用key
            // 为什么多个子节点时会直接被当作使用了key的子节点，这是因为key是可以人为创造的
            childFlags = ChildrenFlags.KEYED_VNODES
            children = normalizeVNodes(children)
        }
    } else if (children === null) {
        // 没有子节点
        childFlags = ChildrenFlags.NO_CHILDREN
    } else if (children._isVNode) {
        // 单个子节点
        childFlags = ChildrenFlags.SINGLE_VNODE
    } else {
        // 其他情况都做为文本节点处理，即单个子节点，会调用 createTextVNode 创建纯文本类型的 VNode
        childFlags = ChildrenFlags.SINGLE_VNODE
        children = createTextVNode(children + '')
    }
    return {
        flags
    }
}


function normalizeVNodes(children) {
    const newChildren = []
    // 遍历children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.key === null) {
            // 如果原来的VNode没有key,则使用竖线与该VNode在数组中的索引拼接而成的字符串做为key
            child.key = '|' + i
        }
        newChildren.push(child)
    }
    // 返回新的children,此时 children 的类型就是 ChildrenFlags.KEYED_VNODES
    return newChildren
}

/**
 * 创建纯文本类型的VNode
 * @param text
 * @return {any}
 */
function createTextVNode(text) {
    return {
        _isVNode: true,
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        // 纯文本类型的VNode，其children属性存储的是与之相符的文本内容
        children: text,
        // 文本节点没有子节点
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}

/**
 * 渲染函数
 * @param vnode
 * @param container 挂载点
 */
function render(vnode, container) {
    const prevVnode = container.vnode
    if (prevVnode === null) {
        if (vnode) {
            // 没有旧 VNode 只有新 VNode 使用 mount 函数挂载全新的 VNode
            mount(vnode, container)
            // 将新的 VNode 添加到 container.vnode 属性下，这样洗一次渲染时旧的VNode 就存在了
            container.vnode = vnode
        }
    }
}
