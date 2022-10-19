// ！！！递归
class Vue {
    constructor(obj_instance) {
        this.$data = obj_instance.data
        Observer(this.$data)
        Compile(obj_instance.el, this)
    }
}
// 数据劫持 - 监听实例里的数据
function Observer(data_instance){
    // 递归出口
    if (!data_instance || typeof data_instance !== 'object') return;
    const depenfency = new Dependency()
    Object.keys(data_instance).forEach(key => {
        // Object.defineProperties（操作对象，操作属性，{
        //    enumerable: true,   // 属性可以枚举
        //    configurable: true, // 属性描述可以被改变
        //    get() {},           // 在访问该属性的时候会触发这个getter函数
        //    set() {},           // 在属性值修改的时候会出发这个setter函数
        // }）
        let value = data_instance[key];
        Observer(value) // 递归 - 子属性 数据劫持
        Object.defineProperty(data_instance,key,{
            enumerable: true,
            configurable: true,
            get() {
                console.log(`访问了属性：${key} -> 值：${value}`)
                console.log('Dependency.temp',Dependency.temp)
                // 订阅这加入以来实例的数组
                Dependency.temp && depenfency.addSub(Dependency.temp)
                if (Dependency.temp){
                    console.log(Dependency.temp)
                }
                return value;
            },
            set(newValue) {
                console.log(`属性${key}的值${value}修改为 -> ${newValue}`)
                value = newValue;
                Observer(newValue)
                depenfency.notify()
            },
        })
    })
}
// HTML 模板解析 - 替换DOME内
function Compile(element, vm){
    //  获取文档中 element 的元素
    vm.$el = document.querySelector(element)
    const fragment = document.createDocumentFragment()
    let child
    // 遍历所有子节点
    while (child = vm.$el.firstChild){
        fragment.append(child);
    }
    fragment_compole(fragment);
    // 替换文档碎片内容
    function fragment_compole(node){
        const pattern = /\{\{\s*(\S+)\s*\}\}/;
        if (node.nodeType == 3){
            const xxx = node.nodeValue
            const result_regex = pattern.exec(node.nodeValue)
            if (result_regex){
              const arr = result_regex[1].split('.');
              const value = arr.reduce((total,current)=> total[current], vm.$data)
              node.nodeValue = xxx.replace(pattern,value)
              // 创建订阅者
                new Watcher(vm, result_regex[1],newValue => {
                    node.nodeValue = xxx.replace(pattern,newValue)
                })
            }
        return
        }
        if (node.nodeType === 1 && node.nodeName === 'INPUT') {
            const attr = Array.from(node.attributes)
            attr.forEach(i=>{
                if (i.nodeName === 'v-model'){
                    const value = i.nodeValue.split(".").reduce((total, current) => total[current], vm.$data);
                    console.log('---arr',value)
                    // const value = i.nodeValue.split('.').reduce(
                    //     (total,current) => total[current], vm.$data
                    // );
                    console.log(value)
                }
            })
        }
        node.childNodes.forEach(child => fragment_compole(child))
    }
    vm.$el.appendChild(fragment)
}
// 依赖 - 收集和通知订阅者
class Dependency {
    constructor() {
        // 存放订阅者信息
        this.subscribers = []
    }
    // 添加订阅者到数组里面
    addSub(sub){
        this.subscribers.push(sub)
    }
    // 遍历订阅者的数组
    notify() {
        this.subscribers.forEach(sub => sub.update())
    }
}

// 订阅者
class Watcher {
    constructor(vm,key,callback) {
        this.vm = vm;
        this.key = key;
        this.callback = callback;
        // 临时属性 - 触发getter  -- 每个节点都触发getter方法
        Dependency.temp = this;
        console.log(`用属性${key} 创建订阅者`)
        key.split('.').reduce((total,current) => total[current], vm.$data)
        Dependency.temp = null;
    }
    update() {
        const value = this.key.split('.').reduce(
            (total,current) => total[current], this.vm.$data
        )
        this.callback(value)
    }
}