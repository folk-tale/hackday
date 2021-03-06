var props = {}; // A hash from ids to Props

// Important semantic clarification:
// Currently, searching locally creates draggable prop elements, but it
// doesn't turn them into network-synchronized Props until you drag them
// onto the stage. As such, dragging them off-stage should delete the Prop.
// (Props are resizable, and can only be dragged by one person at a time.)

// Setting up for when you drop a prop into the stage
$("#stage").droppable({
  drop: function(event, ui) {

    // If the dragged-in image was in the "content" bar, transfer it to the stage
    if (ui.draggable.parent().is($('#content'))) {
      var $imgWrapper = ui.draggable;
      var $img = $imgWrapper.children('img');
      var width = $img.width();
      var height = $img.height();

      var imgX = $imgWrapper.position().left;
      var imgY = $imgWrapper.position().top;
      var stageX = $(this).position().left;
      var stageY = $(this).position().top;
      document.getElementById("stage").appendChild($imgWrapper.get(0));

      //console.log("imageX: " + imgX + ", imageY: " + imgY + ", stageX: " + $(".stage-container") .position().left);
      $imgWrapper.css({
        'position': 'absolute', 
        'left': imgX-$("#stage-inner").position().left, 
        'top': imgY-$("#stage-inner").position().top,
      });

      $img = $imgWrapper.children('img');
      $img.css({
        'max-width': $("#stage").width(),
        'max-height': $("#stage").height()
      });
      $img.width(width);
      $img.height(height);

      addGrowButton($imgWrapper);
      addShrinkButton($imgWrapper);
      
      ui.draggable.hover(
        function() {
          if ($(this).parent().is($('#stage'))) {
            addGrowButton($(this));
            addShrinkButton($(this));
          }
        },function() {
          $('.grow-button').remove();
          $('.shrink-button').remove();
      });

      // Now it needs to be synchronized, so we make it an official prop:
      props[ui.draggable.attr('id')] = addProp(ui.draggable.get(0));

    }
  }
});

// Setting up offstage to properly receive dragged-off props
$("#content").droppable({
  accept: "#stage div", // that way you can't drag around within content
  drop: function(event, ui) {
    if (ui.draggable.parent().is($('#stage'))) {
      var $img = ui.draggable.children('img');

      var width = $img.width();
      var height = $img.height();

      var contentarea = document.getElementById("content");
      var child = ui.draggable.get(0);
      contentarea.insertBefore(child, contentarea.firstChild);
      ui.draggable.css({position: 'relative', left: 0, top: 0});
       $img = ui.draggable.children('img');

      var scaleDownX = 100.0/width;
      var scaleDownY = 100.0/height;

      $img.width(width * Math.min(scaleDownX, scaleDownY));
      $img.height(height * Math.min(scaleDownX, scaleDownY));

      $img.css({
        'max-width': '100px',
        'max-height': '100px'
      });
      $('.grow-button').remove();
      $('.shrink-button').remove();
    }

    // No longer needs to be synchronized, so:
    removeProp(ui.draggable[0].id);
    delete props[ui.draggable[0].id];
  }
});