$(document).ready(() => {

  formatedData = data;
  $(".albumsFilter .search-input").val('');

  $('.tree').tree({
    data: formatedData,
    autoOpen : false,
    dragAndDrop: true,
    openFolderDelay: delay_autoOpen,
    onCreateLi : createAlbumNode,
    onCanSelectNode: function(node) {return false}
  });

  function createAlbumNode(node, li) {
    icon = "<span class='%icon%'></span>";
    title = "<p class='move-cat-title' title='%name%'>%name%</p>";
    toggler_cont = "<div class='move-cat-toogler' data-id=%id%>%content%</div>";
    toggler_close = "<span class='icon-left-open'></span>";
    toggler_open = "<span class='icon-down-open'></span>";
    actions = 
      '<div class="move-cat-action-cont">'
        +"<div class='move-cat-action'>"
          +"<a class='move-cat-add icon-plus-circled' href='#' data-aid='"+node.id+"'></a>"
          +"<a class='move-cat-edit icon-pencil' href='admin.php?page=album-"+node.id+"'></a>"
          +"<a class='move-cat-upload icon-upload' href='admin.php?page=photos_add&album="+node.id+"'></a>"
          +"<a class='move-cat-see icon-eye' href='admin.php?page=album-"+node.id+"'></a>"
          +"<a data-id='"+node.id+"' class='move-cat-delete icon-trash'></a>"
        +"</div>"
      +'</div>';
    action_order = "<a class='move-cat-order icon-sort-name-up' href='admin.php?page=album-"+node.id+"'></a>";

    cont = li.find('.jqtree-element');
    cont.addClass('move-cat-container');
    cont.attr('id', 'cat-'+node.id)
    cont.html('');

    cont.append(actions);

    if (node.children.length != 0) {
      open_nodes = $('.tree').tree('getState').open_nodes;
      if (open_nodes.includes(node.id)) {
        toggler = toggler_open;
      } else {
        toggler = toggler_close;
      }
      cont.append($(toggler_cont
        .replace(/%content%/g, toggler)
        .replace(/%id%/g, node.id)));

      cont.find('.move-cat-action .move-cat-see').after(action_order);
    }

    cont.append($(icon.replace(/%icon%/g, 'icon-grip-vertical-solid')));

    if (node.children.length != 0) {
      cont.append($(icon.replace(/%icon%/g, 'icon-sitemap')));
    } else {
      cont.append($(icon.replace(/%icon%/g, 'icon-folder-open')));
    }

    cont.append($(title.replace(/%name%/g, node.name)));

    if (node.status == 'private') {
      cont.find(".move-cat-title").addClass('icon-lock');
    }

    var colors = ["icon-red", "icon-blue", "icon-yellow", "icon-purple", "icon-green"];
    var colorId = Number(node.id)%5;
    cont.find("span.icon-folder-open, span.icon-sitemap").addClass(colors[colorId]);  

    cont.find(".move-cat-title").after(
      "<div class='badge-container'>" 
        +"<i class='icon-blue icon-sitemap nb-subcats'></i>"
        +"<i class='icon-purple icon-picture nb-images'>"+ node.nb_images +"</i>"
        +"<i class='icon-red icon-back-in-time last-update'>"+ node.last_updates +"</i>"
      +"</div>"
    )

    if (node.nb_subcats) {
      cont.find(".nb-subcats").text(node.nb_subcats);
    } else {
      cont.find(".nb-subcats").hide();
    }
  }

  var url_split = window.location.href.split("#");
  var catToOpen = url_split[url_split.length-1].split("-")[1];

  function isNumeric(num){
    return !isNaN(num)
  }

  if(catToOpen && isNumeric(catToOpen)) {
    goToNode($('.tree').tree('getNodeById', catToOpen), $('.tree').tree('getNodeById', catToOpen));
  }

  $('.tree').on( 'click', '.move-cat-toogler', function(e) {
    var node_id = $(this).attr('data-id');
    var node = $('.tree').tree('getNodeById', node_id);
    if (node) {
      open_nodes = $('.tree').tree('getState').open_nodes;
      if (!open_nodes.includes(node_id)) {
        $(this).html(toggler_open);
        $('.tree').tree('openNode', node);
      } else {
        $(this).html(toggler_close);
        $('.tree').tree('closeNode', node);
      }
    }
  });

  $('.tree').on(
    'tree.open',
    function(e) {
      $('.move-cat-toogler[data-id='+e.node.id+']').html(toggler_open);
    }
  );

  $('.tree').on(
    'tree.close',
    function(e) {
      $('.move-cat-toogler[data-id='+e.node.id+']').html(toggler_close);
    }
  );

  $('.tree').on(
    'tree.move',
    function(event) {
      event.preventDefault();

      if (event.move_info.moved_node.status != 'private') {
        parentIsPrivate = false;
        if (event.move_info.position == 'after') {
          parentIsPrivate = (event.move_info.target_node.parent.status == 'private');
        } else if (event.move_info.position == 'inside') {
          parentIsPrivate = (event.move_info.target_node.status == 'private');
        }
        
        if (parentIsPrivate) {
          $.confirm({
            title: str_are_you_sure.replace(/%s/g, event.move_info.moved_node.name),
            buttons: {
              confirm: {
                text: str_yes_change_parent,
                btnClass: 'btn-red',
                action: function () {
                  makePrivateHierarchy(event.move_info.moved_node);
                  applyMove(event);
                },
              },
              cancel: {
                text: str_no_change_parent
              }
            },
            ...jConfirm_confirm_options
          })
        } else {
          applyMove(event);
        }
      } else {
        applyMove(event);
      }
    }
  );

  $('.tree').on( 'click', '.move-cat-order', function(e) {
    var node_id = $(this).attr('data-id');
    var node = $('.tree').tree('getNodeById', node_id);
    if (node) {
      $('.cat-move-order-popin').fadeIn();
      $('.cat-move-order-popin .album-name').html(getPathNode(node));
      $('.cat-move-order-popin input[name=id]').val(node_id);
    }
  });

  $('.order-root').on( 'click', function() {
    $('.cat-move-order-popin').fadeIn();
    $('.cat-move-order-popin .album-name').html(str_root);
    $('.cat-move-order-popin input[name=id]').val(-1);
  });

  if (openCat != -1) {
    var node = $('.tree').tree('getNodeById', openCat);
    $('.tree').tree('openNode', node);
    $([document.documentElement, document.body]).animate({
      scrollTop: $("#cat-"+openCat).offset().top
    }, 500);
  }

  // tree search

  $(".albumsFilter .search-input").on('input', function () {
    // console.log($(this).val());
    //close the tree

    if ($(".albumsFilter .search-input").val().length >= 2) {
      closeTree($('.tree'));
      $(".jqtree-element").removeClass('animateFocus').removeClass('imune');
      console.log("here");
    }

    if ($(".albumsFilter .search-input").val().length >= 3) {
      $('.tree').tree('getNodeByCallback', 
      function(node) {

        if (node.name.toLowerCase().includes($(".albumsFilter .search-input").val().toLowerCase())) {
          // Node is found
          // console.log("found");
          $("#cat-"+node.id).show().addClass("imune");
          goToNode(node, node)
        }
        else {
          // Node not found
          // console.log("not found");
          if (!$("#cat-"+node.id).hasClass("imune")) {
            $("#cat-"+node.id).hide();
          }
        }
      });
    } else {
      $(".jqtree-element").show();
    }
  })

  // AddAlbumPopIn
  $(".AddAlbumErrors").hide();
  $(".DeleteAlbumErrors").hide();
  $(".add-album-button").on("click", function () {
    openAddAlbumPopIn();
    $(".AddAlbumSubmit").data("a-parent", 0);
  })
  $(".move-cat-add").on("click", function () {
    openAddAlbumPopIn();
    $(".AddAlbumSubmit").data("a-parent", $(this).data("aid"));
  })
  $(".CloseAddAlbum").on("click", function () {
    closeAddAlbumPopIn();
  });
  $(".AddAlbumCancel").on("click", function () {
    closeAddAlbumPopIn();
  });
  $(".DeleteAlbumCancel").on("click", function () {
    closeDeleteAlbumPopIn();
  });

  $(".AddAlbumSubmit").on("click", function () {
    newAlbumName = $(".AddAlbumLabelUsername input").val();
    newAlbumParent = $(".AddAlbumSubmit").data("a-parent");
    newAlbumPosition = $("input[name=position]:checked").val();

    jQuery.ajax({
      url: "ws.php?format=json&method=pwg.categories.add",
      type: "POST",
      data: {
        name : newAlbumName,
        parent : newAlbumParent,
        position : newAlbumPosition
      },
      success: function (raw_data) {
        data = jQuery.parseJSON(raw_data);
        var parent_node = $('.tree').tree('getNodeById', newAlbumParent);
        if (newAlbumPosition == "last") {
          $('.tree').tree(
            'appendNode',
            {
              id: data.result.id,
              isEmptyFolder: true,
              name: newAlbumName
            },
            parent_node
          );
        } else {
          $('.tree').tree(
            'prependNode',
            {
              id: data.result.id,
              isEmptyFolder: true,
              name: newAlbumName
            },
            parent_node
          );
        }

        setSubcatsBadge(parent_node);

        $(".move-cat-add").unbind("click").on("click", function () {
          openAddAlbumPopIn();
          $(".AddAlbumSubmit").data("a-parent", $(this).data("aid"));
        });
        $(".move-cat-delete").on("click", function () {
          triggerDeleteAlbum($(this).data("id"));
        });

        goToNode($(".tree").tree('getNodeById', data.result.id), $(".tree").tree('getNodeById', data.result.id));
        $('html,body').animate({
          scrollTop: $("#cat-" + data.result.id).offset().top - screen.height / 2},
          'slow');
      },
      error: function(message) {
        console.log(message);
      }
    }).done(function () {
      closeAddAlbumPopIn();
    });
  })

  // Delete Album
  $(".move-cat-delete").on("click", function () {
    triggerDeleteAlbum($(this).data("id"));
  })

  /*----------------
  Checkboxes
  ----------------*/

  function checkbox_change() {
    if ($(this).attr('data-selected') == '1') {
        $(this).find("i").hide();
    } else {
        $(this).find("i").show();
    }
  }

  function checkbox_click() {
    if ($(this).attr('data-selected') == '1') {
        $(this).attr('data-selected', '0');
        $(this).find("i").hide();
    } else {
        $(this).attr('data-selected', '1');
        $(this).find("i").show();
    }
  }

  $('.user-list-checkbox').unbind("change").change(checkbox_change);
  $('.user-list-checkbox').unbind("click").click(checkbox_click);

});

function openAddAlbumPopIn() {
  $("#AddAlbum").fadeIn();
  $(".AddAlbumLabelUsername .user-property-input").val('');
  $(".AddAlbumLabelUsername .user-property-input").focus();
}

function closeAddAlbumPopIn() {
  $("#AddAlbum").fadeOut();
}


function triggerDeleteAlbum(cat_id) {
  $.ajax({
    url: "ws.php?format=json&method=pwg.categories.calculateOrphans",
    type: "GET",
    data: {
      category_id: cat_id,
    },
    success: function (raw_data) {
      let data = JSON.parse(raw_data).result[0]
      if (data.nb_images_recursive == 0) {
        $(".deleteAlbumOptions").hide();
      } else {
        $(".deleteAlbumOptions").show();
        if (data.nb_images_associated_outside == 0) {
          $("#IMAGES_ASSOCIATED_OUTSIDE").hide();
        } else {
          $("#IMAGES_ASSOCIATED_OUTSIDE .innerText").html("");
          $("#IMAGES_ASSOCIATED_OUTSIDE .innerText").append(has_images_associated_outside.replace('%d', data.nb_images_recursive).replace('%d', data.nb_images_associated_outside));
        }
        if (data.nb_images_becoming_orphan == 0) {
          $("#IMAGES_BECOMING_ORPHAN").hide();
        } else {
          $("#IMAGES_BECOMING_ORPHAN .innerText").html("");
          $("#IMAGES_BECOMING_ORPHAN .innerText").append(has_images_becomming_orphans.replace('%d', data.nb_images_becoming_orphan));
        }
      }
    },
    error: function(message) {
      console.log(message);
    }
  }).done(function () {
    openDeleteAlbumPopIn(cat_id);
  });
}
function openDeleteAlbumPopIn(cat_to_delete) {
  $("#DeleteAlbum").fadeIn();
  node = $(".tree").tree('getNodeById', cat_to_delete);
  if (node.children.length == 0) {
    $(".DeleteIconTitle span").html(delete_album_with_name.replace("%s", node.name));
  } else {
    nb_sub_cats = 0;
    $(".DeleteIconTitle span").html(delete_album_with_subs.replace("%s", node.name).replace("%d", getAllSubAlbumsFromNode(node, nb_sub_cats)));
  }

  // Actually delete
  $(".DeleteAlbumSubmit").unbind("click").on("click", function () {
    $.ajax({
      url: "ws.php?format=json&method=pwg.categories.delete",
      type: "POST",
      data: {
        category_id: cat_to_delete,
        photo_deletion_mode: $("input [name=photo_deletion_mode]:checked").val(),
        pwg_token: pwg_token,
      },
      success: function (raw_data) {
        parentOfDeletedNode = node.parent
        $('.tree').tree('removeNode', node);

        $(".move-cat-add").on("click", function () {
          openAddAlbumPopIn();
          $(".AddAlbumSubmit").data("a-parent", $(this).data("aid"));
        });
        $(".move-cat-delete").on("click", function () {
          triggerDeleteAlbum($(this).data("id"));
        });

        setSubcatsBadge(parentOfDeletedNode);
        closeDeleteAlbumPopIn();
      },
      error: function(message) {
        console.log(message);
      }
    });
  })

}
function closeDeleteAlbumPopIn() {
  $("#DeleteAlbum").fadeOut();
}

function getAllSubAlbumsFromNode(node, nb_sub_cats) {
  nb_sub_cats = 0;
  if (node.children != 0) {
    node.children.forEach(child => {
      nb_sub_cats++;
      tmp = getAllSubAlbumsFromNode(child, nb_sub_cats);
      nb_sub_cats += tmp;
    });
  } else {
    return 0;
  }
  return nb_sub_cats;
}

function setSubcatsBadge(node) {
  if (node.children.length != 0) {
    $("#cat-"+node.id).find(".nb-subcats").text(node.children.length).show(100);
  } else {
    $("#cat-"+node.id).find(".nb-subcats").hide(100)
  }
}

function goToNode(node, firstNode) {
  // console.log(firstNode.id, node.id);
  if (node.parent) {
    goToNode(node.parent, firstNode);
    if(node != firstNode) {
      $(".tree").tree('openNode', node);
      // console.log("parent id : " + node.parent.id);
      $("#cat-"+node.parent.id).show();
      $("#cat-"+node.parent.id).addClass("imune");
    }
  } else {
    $(".tree").tree('openNode', node);
    $("#cat-"+firstNode.id).addClass("animateFocus");

    showNodeChildrens(firstNode);
  }
}

function showNodeChildrens(node) {
  if (node.children) {
    // console.log("childrens : " + node.children);
    node.children.forEach(child => {
      // console.log("children : " + child.id, child.name);
      $("#cat-"+child.id).addClass("imune");
      showNodeChildrens(child);
    });
    
  }
}

function closeTree(tree) {
  // console.log(tree);
  if (tree.tree('getState').open_nodes.length > 0) {
    tree.tree('getState').open_nodes.forEach(nodeItem => {
      var node = tree.tree('getNodeById', nodeItem);
      tree.tree('closeNode', node);
    });
  }

}

function getId(parent) {
  if (parent.getLevel() == 0) {
    return 0;
  } else {
    return parent.id;
  }
}

function getRank(node, ignoreId = null) {
  if (node.getPreviousSibling() != null) {
    if (node.id != ignoreId) {
      return 1 + getRank(node.getPreviousSibling(), ignoreId);
    } else {
      return getRank(node.getPreviousSibling(), ignoreId);
    }
  } else {
    if (node.id != ignoreId) {
      return 1;
    } else {
      return 0;
    }
  }
}

function applyMove(event) {
  waitingTimeout = setTimeout(() => {
    $('.waiting-message').addClass('visible');  
  }, 500);
  id = event.move_info.moved_node.id;
  moveParent = null;
  moveRank = null;
  previous_parent = event.move_info.previous_parent;
  target = event.move_info.target_node;
  if (event.move_info.position == 'after') {
    if (getId(previous_parent) != getId(target.parent)) {
      moveParent = getId(target.parent);
    }
    moveRank = getRank(target, id) + 1;
  } else if (event.move_info.position == 'inside') {
    if (getId(previous_parent) != getId(target)) {
      moveParent = getId(target);
    }
    moveRank = 1;
  } else if (event.move_info.position == 'before') {
    if (getId(previous_parent) != getId(target.parent)) {
      moveParent = getId(target.parent);
    }
    moveRank = 1;
  } 
  moveNode(id, moveRank, moveParent).then(() => {
    event.move_info.do_move();
    clearTimeout(waitingTimeout);
    $('.waiting-message').removeClass('visible');
    setSubcatsBadge(previous_parent);
    setSubcatsBadge($('.tree').tree('getNodeById', moveParent));
  })
    .catch((message) => console.log('An error has occured : ' + message ));
}

function moveNode(node, rank, parent) {
  return new Promise ((res, rej) => {
    if (parent != null) {
      changeParent(node, parent, rank).then(() => res()).catch(() => rej())
    } else if (rank != null) {
      changeRank(node, rank).then(() => res()).catch(() => rej())
    }
  })
}

function changeParent(node, parent, rank) {
  oldParent = node.parent
  return new Promise((res, rej) => {
    jQuery.ajax({
      url: "ws.php?format=json&method=pwg.categories.move",
      type: "POST",
      data: {
        category_id : node,
        parent : parent,
        pwg_token : pwg_token
      },
      before: function () {
        oldParent = node.parent
      },
      success: function (raw_data) {
        data = jQuery.parseJSON(raw_data);
        if (data.stat === "ok") {
          changeRank(node, rank)
          res();
        } else {
          rej(raw_data);
        }
      },
      error: function(message) {
        rej(message);
      }
    });
  })
}

function changeRank(node, rank) {
  return new Promise((res, rej) => {
    jQuery.ajax({
      url: "ws.php?format=json&method=pwg.categories.setRank",
      type: "POST",
      data: {
        category_id : node,
        rank : rank
      },
      success: function (raw_data) {
        data = jQuery.parseJSON(raw_data);
        if (data.stat === "ok") {
          res();
        } else {
          rej(raw_data);
        }
      },
      error: function(message) {
        rej(message);
      }
    });
  })
}

function makePrivateHierarchy (node) {
  node.status = 'private';
  node.children.forEach(node => {
    makePrivateHierarchy(node);
  });
}

function getPathNode(node) {
  if (node.parent.getLevel() != 0) {
    return getPathNode(node.parent) + ' / ' + node.name;
  } else {
    return node.name;
  }
}