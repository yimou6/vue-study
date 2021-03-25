import VNodeFlags from './vnodeflags'
import ChildrenFlags from './childrenflags'


export function mount(vnode, container) {
    console.log('mount')
    const { flags } = vnode
    if (flags & VNodeFlags.ELEMENT) {
        // 挂载普通标签
        mountElement(vnode, container)
    } else if (flags & VNodeFlags.COMPONENT) {
        // 挂载组件
        mountComponent(vnode, container)
    } else if (flags & VNodeFlags.TEXT) {
        // 挂载纯文本
        mountText(vnode, container)
    } else if (flags & VNodeFlags.FRAGMENT) {
        // 挂载 Fragment
        mountFragment(vnode, container)
    } else if (flags & VNodeFlags.PORTAL) {
        // 挂载 Portal
        mountPortal(vnode, container)
    }
}

const domPropsRE = /\[A-Z]^(?:value|checked|selected|muted)$/
function mountElement(vnode, container, isSVG) {
    // 处理 SVG
    isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
        : document.createElement(vnode.tag)
    // 拿到 VNodeData
    const data = vnode.data
    if (data) {
        for (const key in data) {
            switch (key) {
                case 'style':
                    // 如果 key 的值是 style，说明是内联样式,逐个将样式规则应用到 el
                    for (const k in data.style) {
                        el.style[k] = data.style[k]
                    }
                    break
                case 'class':
                    el.className = data[key]
                    break
                default:
                    if (key[0] === 'o' && key[1] === 'n') {
                        // 事件
                        el.addEventListener(key.slice(2), data[key])
                    } else if (domPropsRE.test(key)) {
                        // 当作 DOM Prop 处理
                        el[key] = data[key]
                    } else {
                        // 当作 Attr 处理
                        el.setAttribute(key, data[key])
                    }
                    break
            }
        }
    }
    vnode.el = el

    // 拿到children和childFlags
    const childFlags = vnode.childFlags
    const children = vnode.children

    // 检测如果没有子节点则无需递归挂载
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            // 如果是单个子节点则调用mount函数挂载
            mount(children, el, isSVG)
        } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
            // 如果是多个子节点则遍历并调用mount函数挂载
            for (let i = 0; i < vnode.children.length; i++) {
                mount(vnode.children[i], el, isSVG)
            }
        }
    }
    container.appendChild(el)
}
function mountComponent(vnode, container, isSVG) {
    if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
        mountStateFulComponent(vnode, container, isSVG)
    } else {
        mountFunctionalComponent(vnode, container, isSVG)
    }
}

/**
 * 有状态组件挂载
 * @param vnode
 * @param container
 * @param isSVG
 */
function mountStateFulComponent(vnode, container, isSVG) {
    // 创建组件实例
    const instance = new vnode.tag()
    // 渲染VNode
    instance.$vnode = instance.render()
    // 挂载
    mount(instance.$vnode, container, isSVG)
    // el属性值和组件实例的$el属性都引用组件的跟DOM元素
    instance.$el = vnode.el = instance.$vnode.el
}

/**
 * 函数式组件挂载
 * @param vnode
 * @param container
 * @param isSVG
 */
function mountFunctionalComponent(vnode, container, isSVG) {
    // 获取 VNode
    const $vnode = vnode.tag()
    // 挂载
    mount($vnode, container, isSVG)
    // el 元素引用该组件的根元素
    vnode.el = $vnode.el
}
function mountText(vnode, container) {
    const el = document.createTextNode(vnode.children)
    vnode.el = el
    container.appendChild(el)
}
function mountFragment(vnode, container, isSVG) {
    // 拿到 children 和 childFlags
    const { children, childFlags } = vnode
    switch (childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            // 如果是单个子节点,则直接调用 mount
            mount(children, container, isSVG)
            // 单个子节点，就指向该节点
            vnode.el = children.el
            break
        case ChildrenFlags.NO_CHILDREN:
            // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
            const placeholder = createTextVNode('')
            mountText(placeholder, container)
            // 没有子节点，指向占位的空文本节点
            vnode.el = placeholder.el
            break
        default:
            // 多个子节点，遍历挂载
            for (let i = 0; i < children.length; i++) {
                mount(children[i], container, isSVG)
            }
            // 多个子节点，指向第一个子节点
            vnode.el = children[0].el
    }
}
function mountPortal(vnode, container) {
    const { tag, children, childFlags } = vnode
    // 获取挂载点
    const target = typeof tag === 'string' ? document.querySelector(tag) : tag
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
        // 将 children 挂载到 target 上，而非 container
        mount(children, target)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
        for (let i = 0; i < children.length; i++) {
            // 将 children 挂载到 target 上，而非 container
            mount(children[i], target)
        }
    }

    // 占位的空文本节点
    const placeholder = createTextVNode('')
    // 将该节点挂载到 container 中
    mountText(placeholder, container, null)
    // el 属性引用该节点
    vnode.el = placeholder.el
}

/**
 * 创建纯文本类型的VNode
 * @param text
 * @return {any}
 */
export function createTextVNode(text) {
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
