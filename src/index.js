// 应用层设计
// 这是框架设计的核心
// 首先考虑应用层的使用，然后再考虑如何与底层衔接
import VNodeFlags from './vnodeflags.js'
import ChildrenFlags from './childrenflags.js'
import { mount, createTextVNode } from './mount.js'

// 唯一标识 Fragment 无外层div
const Fragment = Symbol()
// 唯一标识 Portal 挂载点不确定(dialog)
const Portal = Symbol()

/**
 * 辅助创建VNode的h函数
 * @param tag
 * @param data
 * @param children
 * @return {any}
 */
export function h(tag, data = null, children = null) {
    let flags = null
    if (typeof tag === 'string') {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
        // 序列化 class
        if (data) {
            data.class = normalizeClass(data.class)
        }
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
    // 返回 VNode对象
    return {
        _isVNode: true,
        flags,
        data,
        tag,
        children,
        childFlags,
        el: null
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
 * 序列化 class
 * @param classValue
 * @return {string}
 */
function normalizeClass(classValue) {
    // res 是最终要返回的类名字符串
    let res = ''
    if (typeof  classValue === 'string') {
        res = classValue
    } else if (Array.isArray(classValue)) {
        for (let i = 0; i < classValue.length; i++) {
            res += normalizeClass(classValue[i]) + ''
        }
    } else if (typeof classValue === 'object') {
        for (const name in  classValue) {
            if (classValue[name]) {
                res += name + ' '
            }
        }
    }
    return res.trim()
}


/**
 * 渲染函数
 * @param vnode
 * @param container 挂载点
 */
export function render(vnode, container) {
    const prevVNode = container.vnode || null
    console.log('render', prevVNode)
    if (prevVNode === null) {
        if (vnode) {
            // 没有旧 VNode 只有新 VNode 使用 mount 函数挂载全新的 VNode
            mount(vnode, container)
            // 将新的 VNode 添加到 container.vnode 属性下，这样洗一次渲染时旧的VNode 就存在了
            container.vnode = vnode
        }
    } else {
        if (vnode) {
            // 有旧的 VNode,也有新的 VNode,则调用 patch 函数打补丁
            patch(prevVNode, vnode, container)
            // 更新 container.vnode
            container.vnode = vnode
        } else {
            // 有旧的 VNode 但是没有新的 VNode ,说明应该移除 DOM,在浏览器中可以使用removeChild函数
            container.removeChild(prevVNode.el)
            container.vnode = null
        }
    }
}



function patch(prevVNode, vnode, container) {}

function Vue(options) {
    console.log(1)
}
export default Vue
