/*
 document.addEventListener('DOMContentLoaded', function() {
	getCurrentTabUrl(function(url){
	renderStatus('current page url: ' + url);
	});
  

 });
*/

 
$(document).ready(function(){

    myApp.init();
	//myApp.getCurrentPageData();

	$(".add-button").click(function(){
		
		myApp.addCurrentItemInStorage();
	});
	$(".add-tag-button").click(function () {

	    myApp.addTagToCurrentTags();
	});
	$(".clear-button").click(function () {

	    myApp.clearAllItemsFromStorage();
	});
	$(document).on('click', '.delete-x', myApp.deleteItem);
	$(document).on('click', '.tag-text', myApp.assignTagToItem);
	//renderStatus('current page url: ' + result.url);
    
});

// declare namespace and application
myApp = {	
	
    domain: {	    
        Article: function (url, title){
            this.id = myApp.utils.genarateId();
            this.url = url;
            this.title = title;
            this.tags = [];
            this.getData = function () {
                return JSON.stringify(this);
            };
        },
        Tag: function (name) {
            this.id = myApp.utils.genarateId();
            this.name = name;
            this.addedToItem = false;
        },
        StaticTags: ["Tech", "Weather", "LifeStyle", "Sport", "Politics", "World Affairs", "Entertainment"]

    },
    utils: {
        genarateId: function () {
            var date = new Date();
            return date.getFullYear() + "" + (date.getMonth() + 1) + "" + date.getDate() + "" + date.getHours() + "" + date.getMinutes() + "" + date.getSeconds() + "_"  + Math.floor((Math.random() * 100) + 1);;
        },
        deleteItemFromArray: function (arr, item) {
            var index = arr.indexOf(item);
            if (index > -1) {
                arr.splice(index, 1);
            }
            return arr;
        },
    },
	init: function(){
	    // get all the saved items
	    this.getCurrentItemsFromStorage();
	    this.getCurrentTagsFromStorage();
	    this.getCurrentPageData();
	},
	getCurrentPageData: function(){	
    
	    getCurrentTabUrl(this, function (url, title) {
			 var art1 = new this.domain.Article(url, title);
			 this.setCurrentItem(art1);			 
	    });

	    getCurrentPageKeyWords(myApp, myApp.addTagSuggestions);
	},
	deleteItem: function(){
	    var id = $(this).attr("id");
	    var type = $(this).attr("type");
	    if (id && id != "") {

            if(type === 'item')
                myApp.deleteItemFromStorage(id);
            
            if (type === 'tag') {
                
                if (myApp.isTagAddedInCurrentItem(id)) {

                    var tagObj = myApp.getTagObj(myApp.currentItem.tags, id);
                    if (tagObj == null) return;

                    myApp.currentItem.tags = myApp.utils.deleteItemFromArray(myApp.currentItem.tags, tagObj);

                    myApp.showTagsInContainer(".item-tags", myApp.currentItem.tags);
                }
                else {
                    // delete the tag from current tags

                    var tagObj = myApp.getTagObj(myApp.currentTags, id);
                    if (tagObj == null) return;

                    myApp.currentTags = myApp.utils.deleteItemFromArray(myApp.currentTags, tagObj);
                    myApp.saveCurrentTagsInStorage();
                }
            }
                
	    }
	},
	

    // storage methods
	addCurrentItemInStorage: function(){
		
		var item = this.getCurrentItem();
		var arr = this.currentSavedItems || [];
		if (arr.unshift && typeof arr.unshift == 'function') {
		    arr.unshift(item);
		};
		this.currentSavedItems = arr;
		this.saveCurrentItemsInStorage();
		this.clearCurrentItemInView();
	},
	deleteItemFromStorage:  function (itemId) {

	    var arr = this.currentSavedItems;
	    // remove item from arr

	    arr = this.currentSavedItems.filter(function (item) {
	        return item.id != itemId;
	    });

	    this.currentSavedItems = arr;
	    this.saveCurrentItemsInStorage();
	},
	saveCurrentItemsInStorage: function () {
	    chrome.storage.local.set({ 'items': myApp.currentSavedItems }, function () {
	        // Notify that we saved.
	        var a = 'success';
	        myApp.showItemsInView();
	    });
	},
	getCurrentItemsFromStorage: function(){
			chrome.storage.local.get('items', function (obj){

			    if (obj && obj.items && obj.items.push && typeof obj.items.push == 'function') {
			        myApp.currentSavedItems = obj.items;
			    };
			    myApp.showItemsInView();
			});
	},
	clearAllItemsFromStorage: function () {
	    chrome.storage.local.set({ 'items': [] }, function () {
	        var a = "items cleared";
	        myApp.currentSavedItems = [];
	        myApp.showItemsInView();
	    });
	},
	saveCurrentTagsInStorage: function () {
	    chrome.storage.local.set({ 'tags': myApp.currentTags }, function () {
	        // Notify that we saved.
	        var a = 'success';
	        myApp.showTagsInView();
	    });
	},
	getCurrentTagsFromStorage: function () {
	    chrome.storage.local.get('tags', function (obj) {

	        if (obj && obj.tags && obj.tags.length > 0) {

	            myApp.currentTags = obj.tags;
	        }
	        else {
	            myApp.generateTags();
	        }
	        myApp.showTagsInView();
	    });
	},


    // tag related methods
	generateTags: function () {
	    var tags = [];
	    for (var i = 0; i < this.domain.StaticTags.length; i++) {
	        var tag = new this.domain.Tag(this.domain.StaticTags[i]);
	        tags.push(tag);
	    }
	    this.currentTags = tags;
	},
	getTagObj: function (tagSource, id) {
	    var tagObj = tagSource.filter(function (tag) {
	        return tag.id == id;
	    });

	    if (tagObj.length == 0)
	        return null;
	    return tagObj[0];
	},
	assignTagToItem: function () {
	    var id = $(this).attr("id");
	    if (id && id != "") {

	        // get the tag object 
	        var tagObj = myApp.getTagObj(myApp.currentTags, id);
	        if (tagObj == null) {

                // if a tag suggestion add to current tags
	            tagObj = myApp.getTagObj(myApp.tagSuggestions, id);
	            if (tagObj == null)
	                return;

	            myApp.currentTags.push(tagObj);
	            myApp.showTagsInView();
	            myApp.saveCurrentTagsInStorage();
	        }

	        if(myApp.isTagAddedInCurrentItem(tagObj.id))
	            return;

	        // add this tag to ariticle item
	        tagObj.addedToItem = true;
	        myApp.currentItem.tags.push(tagObj);

	        // show this tag in article tag section
	        myApp.showTagsInContainer(".item-tags", myApp.currentItem.tags);
	    }
	},
	isTagAddedInCurrentItem: function(id){

	    var tagExist = myApp.currentItem.tags.filter(function (tag) {
	        return tag.id == id;
	    });
	    return tagExist.length > 0;
	},
	addTagToCurrentTags: function () {

	    var tag = new myApp.domain.Tag($(".add-tag-input").val());
	    myApp.currentTags.push(tag);
	    //myApp.showTagsInView();
	    myApp.saveCurrentTagsInStorage();
	},
	addTagSuggestions: function (keywords) {

	    if (keywords == "") return;
	    var arr = keywords.split(',');
	    if (arr.length > 5)
	        arr = arr.slice(0, 5);
	    var tagSugs = arr.map(function (ts) {
	        return new myApp.domain.Tag(ts);
	    });
	    myApp.tagSuggestions = tagSugs;
	    myApp.showTagsInContainer(".tags-suggestion-area", tagSugs)
	},
    

    // view methods
	clearCurrentItemInView: function () {
	    var item = new myApp.domain.Article("", "");
	    myApp.currentItem = item;
	    myApp.showCurrentItemInView(item);
	    myApp.showTagsInContainer(".item-tags", myApp.currentItem.tags);
	},
	showCurrentItemInView: function (item) {

	    //var item = myApp.getCurrentItem();
	    $(".item-title-text").val(item.title);
	    $(".item-url").text(item.url);

	},
	showItemsInView: function () {
	    $(".added-before-list").empty();
	    var tplItems = this.currentSavedItems.map(this.createHtmlTemplateForItem);

	    for (var i = 0; i < tplItems.length; i++) {
	        $(".added-before-list").append(tplItems[i]);
	    }
	},
	showTagsInView: function () {

	    this.showTagsInContainer(".select-tags-area", this.currentTags);
	},
	showTagsInContainer: function (containerCls, tagSource) {

	    var tplTags = tagSource.map(myApp.createHtmlTemplateForTag);
	    var innerhtml = "";
	    for (var i = 0; i < tplTags.length; i++) {
	        innerhtml += tplTags[i];
	    }

	    $(containerCls).html(innerhtml);
	},
	createHtmlTemplateForItem: function (item) {

	    var tpl = "<li class='list-item'>" +
                    "<a href='" + item.url + "'>" +
                        "<div>" +
                            "<span class='list-item-title'>" + item.title + "</span> <span class='delete-x' type='item' id='"+ item.id +"'>[X]</span> <br />" +
                            "<span class='list-item-url'>" + item.url + "</span><br />" +
                            "<div class='list-item-tags'>[TagsPlaceHolder]</div>"+
                        "</div>" +
                    "</a>" +
                "</li>";
	    var innerhtml = "";

	    if (item.tags) {
	        var tplTags =
                item.tags
                .map(function (tag) {
                    return new myApp.domain.Tag(tag.name); // to prevent obj reference
                })
                .map(myApp.createHtmlTemplateForTag);

	        for (var i = 0; i < tplTags.length; i++) {
	            innerhtml += tplTags[i];
	        }
	    }
        tpl = tpl.replace("[TagsPlaceHolder]", innerhtml);

	    return tpl;
	},
	createHtmlTemplateForTag: function (tag) {
	    var tpl = "<div class='tag'>" +
                    "<span class='tag-text' id='" + tag.id + "' >" + tag.name + " </span><span class='delete-x' type='tag' id='" + tag.id + "' >X</span>" +
                "</div>";

	    return tpl;
	},


    // properties and setter,getter methods
	setCurrentItem: function(curItem){
		this.currentItem = curItem;
		this.showCurrentItemInView(curItem);
	},
	getCurrentItem: function(){
		var itemInView = this.getCurrentItemFromView();
		this.currentItem = itemInView;
		return this.currentItem;
	},
	getCurrentItemFromView: function(){
		var title = $(".item-title-text").val();
		//var url = $(".item-url").text();
		
		if (this.currentItem && this.currentItem.url) {
		    this.currentItem.title = title;
		    return this.currentItem;
		}
		else {
		    var item = new this.domain.Article(url, title);
		    return item;
		}

	},
	currentItem: {},
	currentSavedItems: [],
	currentTags: [],
    tagSuggestions: []
	
	
};


/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(context, callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {

    var tab = tabs[0];

    var url = tab.url;
    var title = tab.title;

    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback.call(context, url, title);
  });
  
}

function getCurrentPageKeyWords(context, callback) {

    var code = 'var meta = document.querySelector("meta[name=\'Keywords\'], meta[name=\'keywords\']");' +
           'if (meta) meta = meta.getAttribute("content");' +
           '({' +
           '    title: document.title,' +
           '    description: meta || ""' +
           '});';
    chrome.tabs.executeScript({
        code: code
    }, function (results) {
        if (!results) {
            // An error occurred at executing the script. You've probably not got
            // the permission to execute a content script for the current tab
            return;
        }
        var result = results[0];
        callback.call(context, result.description);
        // Now, do something with result.title and result.description
    });
}

