
function IdFactory() {
	var i = 0;
	return {getId:function(){return i++;}}
}
var idCreator = IdFactory();

function Subscriber(fn, options, context) {
	this.id = idCreator.getId();
	this.fn = fn;
	this.options = options;
	this.context = context;
	this.topic = null;
}

function Topic(namespace) {
	this.namespace = namespace || "";
	this._callbacks = [];
	this._topics = [];
	this.stopped = false;
}

Topic.prototype = {

	//增加订阅者，其实是在这里实例化和添加的
	AddSubscriber: function(fn, options, context) {
		var callback = new Subscriber(fn, options, context);
		this._callbacks.push(callback);
		callback.topic = this; //还把这个主题本身放到这个订阅者中~
		return callback;
	},

	StopPropagation: function() {
		this.stopped = true;
	},

	//根据id来获取订阅者
	GetSubscriber: function(identifier) {
		for (var x = 0, y = this._callbacks.length; x < y; x++) {
			if (this._callbacks[x].id == identifier || this._callbacks[x].fn == identifier) {
				return this._callbacks[x];
			}
		}
		for (var z in this._topics) {
			if (this._topics.hasOwnProperty(z)) {
				var sub = this._topics[z].GetSubscriber(identifier);
				if (sub !== undefined) {
					return sub;
				}
			}
		}
	},

	AddTopic: function(topic) {
		this._topics[topic] = new Topic((this.namespace ? this.namespace + ":" : "") + topic);
	},

	HasTopic: function(topic) {
		return this._topics.hasOwnProperty(topic);
	},

	ReturnTopic: function(topic) {
		return this._topics[topic];
	},

	RemoveSubscriber: function(identifier) {
		if (!identifier) {
			this._callbacks = [];
			for (var z in this._topics) {
				if (this._topics.hasOwnProperty(z)) {
					this._topics[z].RemoveSubscriber(identifier);
				}
			}
		}
		for (var y = 0, x = this._callbacks.length; y < x; y++) {
			if (this._callbacks[y].fn == identifier || this._callbacks[y].id == identifier) {
				this._callbacks[y].topic = null;
				this._callbacks.splice(y, 1);
				x--;
				y--;
			}
		}
	},

	Publish: function(data) {
		for (var y = 0, x = this._callbacks.length; y < x; y++) {
			var callback = this._callbacks[y],l;
			callback.fn.apply(callback.context, data);
			l = this._callbacks.length;
			if (l < x) {
				y--;
				x = l;
			}
		}
		for (var x in this._topics) {
			if (!this.stopped) {
				if (this._topics.hasOwnProperty(x)) {
					this._topics[x].Publish(data);
				}
			}
		}
		this.stopped = false;
	}
};


function Mediator() {
	this._topics = new Topic("");
};

Mediator.prototype = {

	//我们可以看到下面的实现逻辑中，主要是依赖的主题对象，（使用了很多的主题对象的方法。）

	//订阅
	Subscribe: function(topicName, fn, options, context) {
		var options = options || {},
			context = context || {},
			topic = this.GetTopic(topicName),
			sub = topic.AddSubscriber(fn, options, context);
		return sub;
	},
	//发布
	Publish: function(topicName) {
		var args = Array.prototype.slice.call(arguments, 1),
			topic = this.GetTopic(topicName);
		args.push(topic);
		this.GetTopic(topicName).Publish(args);
	},
	//移除订阅者
	Remove: function(topicName, identifier) {
		this.GetTopic(topicName).RemoveSubscriber(identifier);
	},
	//获取订阅者
	GetSubscriber: function(identifier, topic) {
		return this.GetTopic(topic || "").GetSubscriber(identifier);
	},
	//获取主题
	GetTopic: function(namespace) {
		var topic = this._topics,
			namespaceHierarchy = namespace.split(":");
		if (namespace === "") {
			return topic;
		}
		if (namespaceHierarchy.length > 0) {
			for (var i = 0, j = namespaceHierarchy.length; i < j; i++) {
				//判断主题对象是否存在，不存在则添加（所以其实也是一个创建的过程。）
				if (!topic.HasTopic(namespaceHierarchy[i])) {
					topic.AddTopic(namespaceHierarchy[i]);
				}
				//存在的话就获取子级的引用。
				//然后通过循环，完成最后一个层级的那个主题。
				topic = topic.ReturnTopic(namespaceHierarchy[i]);
			}
		}
		return topic;
	}
};


var m = new Mediator();
l(m);
function xxx(){l('兰陵王')}
m.Subscribe("king:blue:llw",xxx);
/*m.Subscribe("king:blue:cyj",function(){l('程咬金')});
m.Subscribe("king:blue:cyj",function(){l('复制程咬金')});
m.Subscribe("king:red:swk",function(){l('孙悟空')});*/
//m.Remove("king")
l(m.GetTopic(''))
/*l(m.GetSubscriber('0'))
l(m.GetSubscriber('0')===m.GetSubscriber('0').topic._callbacks[0])
l(m.GetSubscriber('0').fn==xxx)*/
//m.Publish("");

//该模式中，比较核心部分，也是逻辑比较复杂的地方，就是“主题”对象。
//它是这么定义的：

//首先，一上来就是一个主题对象。
//第一个层级的主题对象（根），默认命名空间为空。
//如果topicName参数为空字符串，该主题对象中就不再嵌套子集主题了。（换句话说，就是属性_topics是空数组）
//如果topicName参数为字符串“king”，该主题对象的属性_topics，就有一个“king”字段的属性，其值是一个二级的主题对象。
	//然后，现在就是在子集主题对象中了。
	//第二个层级的主题对象，默认的命名空间为“king”
	//如果，topicName参数为字符串“king:blue”，那么该二级主题对象的属性_topics，就有一个“blue”字段的属性，其值是一个第三级的主题对象。
		//继续，现在进入该主题对象
		//第三层级的主题对象，默认的命名空间为“king:blue”
		//如果，topicName参数为字符串“king:blue:llw”，那么该三级主题对象的属性_topics，就有一个“llw”字段的属性，其值是一个第四级的主题对象。
			//继续，现在进入该主题对象
			//第四层级的主题对象，默认的命名空间为“king:blue:llw”
			//如果，topicName参数为字符串“king:blue:llw”到此结束，那么该三级主题对象的属性_topics，再也没有子级主题对象了~~

//上面是个递归的操作。相对复杂点~