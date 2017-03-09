
// Pass in a context to attach our Mediator to. 
// By default this will be the window object
(function(root) {

	function guidGenerator() {
	    var S4 = function() {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };
	    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}

	// Our Subscriber constructor
	function Subscriber(fn, options, context) {
		if (!this instanceof Subscriber) {
			return new Subscriber(fn, context, options);
		} else {
			// guidGenerator() is a function that generates 
			// GUIDs for instances of our Mediators Subscribers so
			// we can easily reference them later on. We're going
			// to skip its implementation for brevity
			this.id = guidGenerator();
			this.fn = fn;
			this.options = options;
			this.context = context;
			this.topic = null;
		}
	}

	// Let's model the Topic.
	// JavaScript lets us use a Function object as a 
	// conjunction of a prototype for use with the new 
	// object and a constructor function to be invoked.
	function Topic(namespace) {
		if (!this instanceof Topic) {
			return new Topic(namespace);
		} else {
			this.namespace = namespace || "";
			this._callbacks = [];
			this._topics = [];
			this.stopped = false;
		}
	}

	// Define the prototype for our topic, including ways to
	// add new subscribers or retrieve existing ones.
	Topic.prototype = {
		// Add a new subscriber 
		AddSubscriber: function(fn, options, context) {
			var callback = new Subscriber(fn, options, context);
			this._callbacks.push(callback);
			callback.topic = this;
			return callback;
		},

		StopPropagation: function() {
			this.stopped = true;
		},

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
		if (!this instanceof Mediator) {
			return new Mediator();
		} else {
			this._topics = new Topic("");
		}
	};

	Mediator.prototype = {
		GetTopic: function(namespace) {
			var topic = this._topics,
				namespaceHierarchy = namespace.split(":");
			if (namespace === "") {
				return topic;
			}
			if (namespaceHierarchy.length > 0) {
				for (var i = 0, j = namespaceHierarchy.length; i < j; i++) {
					if (!topic.HasTopic(namespaceHierarchy[i])) {
						topic.AddTopic(namespaceHierarchy[i]);
					}
					topic = topic.ReturnTopic(namespaceHierarchy[i]);
				}
			}
			return topic;
		},
		Subscribe: function(topicName, fn, options, context) {
			var options = options || {},
				context = context || {},
				topic = this.GetTopic(topicName),
				sub = topic.AddSubscriber(fn, options, context);
			return sub;
		},

		// Returns a subscriber for a given subscriber id / named function and topic namespace
		GetSubscriber: function(identifier, topic) {
			return this.GetTopic(topic || "").GetSubscriber(identifier);
		},

		// Remove a subscriber from a given topic namespace recursively based on
		// a provided subscriber id or named function.
		Remove: function(topicName, identifier) {
			this.GetTopic(topicName).RemoveSubscriber(identifier);
		},

		//Mediator.Publish( "inbox:messages:new", [args] );
		Publish: function(topicName) {
			var args = Array.prototype.slice.call(arguments, 1),
				topic = this.GetTopic(topicName);
			args.push(topic);
			this.GetTopic(topicName).Publish(args);
		}
	};

	root.Mediator = Mediator;
	Mediator.Topic = Topic;
	Mediator.Subscriber = Subscriber;

	// Remember we can pass anything in here. I've passed in window to
	// attach the Mediator to, but we can just as easily attach it to another
	// object if desired.
})(window);


/*var m = new Mediator()
m.Subscribe("inbox:messages:new",function(){l(111)});
m.Subscribe("inbox:messages:new",function(){l(222)});
m.Publish( "inbox");*/



