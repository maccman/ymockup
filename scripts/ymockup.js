jQuery.fn.outerHTML = function() {
  return $('<div>').append( this.eq(0).clone() ).html();
};

jQuery.fn.dataName = function(){
  return $(this).attr("data-name");
};

var Type = SuperModel.setup("Type");
Type.attributes = ["name", "html"];

Type.extend({
  forName: function(name){
    return this.findByAttribute("name", name);
  }
});

var Element = SuperModel.setup("Element");
Element.attributes = ["typeID", "html"];

Element.extend({
  append: function(){
    this.each(function(el){ el.append(); });
  }
});

Element.extend(SuperModelMarshal);

Element.include({
  type: function(){
    return Type.find(this.typeID);
  },
  
  append: function(){
    var html = this.html;
    if ( !html ) html = this.type().html;
    this.ref = $(html);
    this.ref.addClass("ymockupType");
    
    if ( !this.ref.css("left") ) {
      this.ref.css({
        position: "absolute",
        left: "20%",
        top: "20%"
      });
    }
    
    // Cancel null to make input draggable
    this.ref.draggable({cancel:null});
    this.ref.bind("dragstop", $.proxy(function(){ this.updateOffset(); }, this));
    // No resize event :(
    this.ref.bind("mouseup", $.proxy(function(){ this.updateSize(); }, this));
    this.ref.bind("focus", $.proxy(function(){ this._class.selected = this; }, this));
    this.ref.bind("click", $.proxy(function(){ this._class.selected = this; }, this));

    $("body").append(this.ref);
  },
  
  remove: function(){
    this.ref.remove();
  },
  
  updateOffset: function(){
    var offset = this.ref.offset();
    this.top  = offset.top;
    this.left = offset.left;
    this.save();
  },
  
  updateSize: function(){
    this.width  = this.ref.width();
    this.height = this.ref.height();
  }
});

Element.selectedUpdate = jQuery.noop;

Element.getters({
  selected: function(){
    return this._selected;
  }
});

Element.setters({
  selected: function(value){
    this._selected = value;
    this.selectedUpdate(value);
  }
})

Element.fn.getters({
  html: function(){
    if (this.ref) return(this.ref.outerHTML())
    return this._html;
  },
  
  name: function(){
    return this.type().name + " #" + this.id;
  },
  
  zindex: function(){
    var zi = this.ref && this.ref.css("z-index");
    return(parseInt(zi) || 0);
  }
})

Element.fn.setters({
  typeName: function(name){
    this.typeID = Type.forName(name).id;
  },
  
  html: function(html){
    this._html = html;
  },
  
  zindex: function(value){
    this.ref.css("z-index", value);
  }
});

Element.afterCreate(function(el){
  el.append();
});

Element.afterDestroy(function(el){
  el.remove();
});

jQuery(function($){
  var ymockup  = $("#ymockup")
  ymockup.draggable();
  
  var ymockupCreate = ymockup.find("[data-name='create']");
  
  ymockupCreate.find("form").live("submit", function(){
    Element.create({typeName: ymockup.find("select").val()})
    return false;
  });
  
  Type.chain(ymockupCreate, {
    anchor:"select", 
    builder: function(){
      var data = this.item();
      this.text(data.name);
    }
  });
  
  var ymockupSelected = ymockup.find("[data-name='selected']");
  
  ymockupSelected.find("button").click(function(){
    Element.selected.destroy();
    Element.selected = null;
    return false;
  });
  
  ymockupSelected.find("input").change(function(){
    Element.selected.zindex = $(this).val();
  });
  
  Element.selectedUpdate = function(value){
    ymockupSelected[value ? "show" : "hide"]();
    if( value ) {
      ymockupSelected.find("span").text(value.name);
      ymockupSelected.find("input").val(value.zindex);
    }
  };
  Element.selected = null;
  
  $.get("types.html", function(data){
    $("#ymockupTypes").html(data);
    
    $("#ymockupTypes >*").each(function(i, element){
      element = $(element);
      Type.create({
        name: element.dataName(), 
        html: element.outerHTML(),
        ref: element
      });
    });
    
    Element.append();
  });
});