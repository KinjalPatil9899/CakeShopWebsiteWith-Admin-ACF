const { json } = require('express');
var express = require('express');
var router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : process.env.host,
  user     : process.env.user,
  password : process.env.password,
  database : process.env.database
});

connection.connect(function(err){
  if(!err){
    console.log("database is connected");
  } else {
    console.log("error connecting database");
  }
});

function isAuthenticated (req, res, next) {
  if(req.session.user){
    global.username = req.session.user;
    global.userid = req.session.user_id;
    next();
  } else {
    res.redirect('/login');
  }
}

/* GET dashboard page. */
router.get('/',isAuthenticated, function(req, res, next) {
  res.render('admin/dashboard');
});

/* GET pages page. */
router.get('/pages',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_pages", function(err, result) {
    console.log(result);
    if(result.length < 0) {
      res.render('admin/pages');
    } else {
      if(result.length > 0){
        res.render('admin/pages', {pagesList : result, username : username, userid : userid });
      } else {
        var result = "";
        res.render('admin/pages', {pagesList : result, username : username, userid : userid });
      }
    }
  })
});

/* POST save_page page. */
router.post('/save_page',isAuthenticated, function(req, res, next) {

  const mybodydata = {
    page_name : req.body.page_name,
  }

  connection.query("insert into tbl_pages set ?", mybodydata, function(err, result) {
    if(err) {
        console.log(err);
        res.redirect('/admin/pages');
    } else {
        console.log(result);
        res.redirect('/admin/pages');
    }
  })
});

/* GET update_page page. */
router.get('/update_page/:id',isAuthenticated, function(req, res, next) {
  var page_id = req.params.id;
  connection.query("select * from tbl_pages where page_id = ?", page_id, function(err, result) {
    console.log(result);
    if(result.length > 0){
      res.render('admin/update_page', {pagesList : result});
    } else {
      var result = "";
      res.render('admin/update_page', {pagesList : result});
    }
  })
});

/* GET save_update_page page. */
router.post('/save_update_page/:id',isAuthenticated, function (req, res, next){
  //console.log(req.body);
  console.log("Parameter ID " + req.params.id);

  var page_id = req.params.id;
  var page_name = req.body.page_name;

  connection.query("update tbl_pages set page_name = ? where page_id = ? ", [page_name,page_id], function(err, result) {
    console.log(page_id);
    if(err) {
      res.redirect('/admin/update_page/'+page_id);
    } else {
      connection.query("update tbl_field_groups set page_name = ? where page_id = ? ", [page_name,page_id], function(err, result) {
        if(err) {
          res.redirect('/admin/update_page/'+page_id);
        } else {
          res.redirect('/admin/pages');
        }
      })
    }
  })
});

/* GET page_delete page. */
router.get('/page_delete/:id',isAuthenticated, function (req, res, next){
  var deleteid = req.params.id;
  console.log(`Parameter value is ${deleteid}`);
  connection.query("select * from tbl_field_groups where page_id = ? ", [deleteid], function (err, rows){
    console.log(rows);
    if(rows.length > 0){
      var field_groups_id = [];
      var i=0;
      rows.forEach(key => {
        field_groups_id[i] = key.field_groups_id;
        i++;
      });
      connection.query("delete from tbl_pages where page_id = ? ", [deleteid], function (err, rows){
        if(err){
          res.render('admin/pages', {error_message : err});
        } else {
          connection.query("select * from tbl_fields where field_groups_id IN (?) ", [field_groups_id], function(err, field_groups) {
            console.log(field_groups);
            if(err) {
              res.render('admin/custom_fields', {error_message : err});
            } else {
              if(field_groups.length > 0){  
                var fields_id = [];
                var i = 0;
                field_groups.forEach(key => {
                  fields_id[i] = key.fields_id;
                  i++;
                });
                connection.query("delete from tbl_field_groups where field_groups_id IN (?) ", [field_groups_id], function (err, rows){
                  console.log(err);
                  if(err){
                    res.render('admin/custom_fields', {error_message : err});
                  } else {
                    if(rows && rows.affectedRows > 0){
                      connection.query("delete from tbl_fields where field_groups_id IN (?) ", [field_groups_id], function (err, rows){ 
                        console.log(err);
                        if(err){
                          res.render('admin/custom_fields', {error_message : err});
                        } else {
                          if(rows && rows.affectedRows > 0){
                            connection.query("delete from tbl_page_meta where field_groups_id IN (?) ", [field_groups_id], function (err, rows){ 
                              console.log(err);
                              if(err){
                                res.render('admin/custom_fields', {error_message : err});
                              } else {
                                if(rows && rows.affectedRows > 0){
                                  connection.query("delete from tbl_repeater_fields where fields_id IN (?) ", [fields_id], function (err, rows){ 
                                    console.log(err);
                                    if(err){
                                      res.render('admin/custom_fields', {error_message : err});
                                    } else {
                                      if(rows && rows.affectedRows > 0){
                                        res.redirect('back');
                                      } else {
                                        var err = "Data not found";
                                        res.render('admin/custom_fields', {error_message : err});
                                      }
                                    }
                                  })
                                } else {
                                  var err = "Data not found";
                                  res.render('admin/custom_fields', {error_message : err});
                                }
                              }
                            })
                          } else {
                            var err = "Data not found";
                            res.render('admin/custom_fields', {error_message : err});
                          }
                        }
                      })
                    } else {
                      var err = "Data not found";
                      res.render('admin/custom_fields', {error_message : err});
                    }
                  }
                })
              } else {
                var err = "Data not found";
                res.render('admin/custom_fields', {error_message : err});
              }
            }
          })

        }
      })
    } else {
      connection.query("delete from tbl_pages where page_id = ? ", [deleteid], function (err, rows){
        if(err){
          res.render('admin/pages', {error_message : err});
        } else {
          if(rows && rows.affectedRows > 0){
            res.redirect('back');
          } else {
            var err = "Data not found";
            res.render('admin/pages', {error_message : err});
          }
        }
       })
    }
  })
});

/* POST page_edit page. */
router.get('/page_edit/:id',isAuthenticated, function(req, res, next) {

  var id = req.params.id;
  //console.log(id);

  connection.query("select * from tbl_pages where page_id = ?", id, function(err, result) {
    //console.log(result);
    if(err) {
      res.render('admin/pages', {error_message : err});
    } else {
      var page_name = result[0].page_name;

      connection.query("select * from tbl_field_groups where page_name = ? ", page_name, function(err, field_groups) {
        //console.log(field_groups);
        var field_groups_id = [];
        var i = 0;
        field_groups.forEach(key => {
          field_groups_id[i] = key.field_groups_id;
          i++;
        });
        console.log(field_groups_id);
        if(err) {
          res.redirect('/admin/pages');
        } else {
          if(field_groups != "") {
            connection.query("select * from `tbl_fields` JOIN `tbl_field_type` ON `tbl_field_type`.`field_type_id` = `tbl_fields`.`field_type_id` JOIN `tbl_page_meta` ON `tbl_page_meta`.`page_meta_name` = `tbl_fields`.`fields_value` where `tbl_fields`.`field_groups_id` IN (?) and `tbl_page_meta`.`field_groups_id` IN (?)", [field_groups_id, field_groups_id], function(err, page_meta) {
              console.log(page_meta);
              if(err) {
                res.render('admin/pages', {error_message : err});
              } else {
                if(page_meta.length > 0){
                  connection.query("select * from `tbl_repeater_fields` JOIN `tbl_field_type` ON `tbl_field_type`.`field_type_id` = `tbl_repeater_fields`.`field_type_id` JOIN `tbl_fields` ON `tbl_fields`.`fields_id` = `tbl_repeater_fields`.`fields_id` where `tbl_fields`.`field_groups_id` IN (?)", [field_groups_id], function(err, repeater_fields) {
                    console.log(repeater_fields);
                    if(err) {
                      res.render('admin/pages', {error_message : err});
                    } else {
                      if(repeater_fields.length > 0){
                        res.render('admin/page_update', {fields_list: page_meta, repeater_fields_list: repeater_fields, pageName: page_name, pageId: id});
                      } else {
                        var repeater_fields = "";
                        res.render('admin/page_edit', {fields_list: page_meta, repeater_fields_list: repeater_fields, pageName: page_name, pageId: id});
                      }
                    }
                  })
                } else {
                  var page_meta = "";
                  res.render('admin/page_edit', {fields_list: page_meta, pageName: page_name, pageId: id});
                }
              }
            })
          } else {
            var fields = "";
            res.render('admin/page_edit', {fields_list: fields, pageName: page_name, pageId: id});
          }
        }
      })
    }
  })
});

/* POST page_update page. */
router.post('/page_update/:id',isAuthenticated, function(req, res, next) {

  let uploadPath;

  var id = req.params.id;
  var repeater_array = [];
  var repeater_array_file = [];
  //console.log(id);

  connection.query("select * from tbl_pages where page_id = ?", id, function(err, result) {
    //console.log(result);
    if(err) {
      res.render('admin/pages', {error_message : err});
    } else {
      var page_name = result[0].page_name;

      connection.query("select * from tbl_field_groups where page_name = ? ", page_name, function(err, field_groups) {
        //console.log(field_groups);
        if(err) {
          res.render('admin/pages', {error_message : err});
        } else {
          var field_groups_id = field_groups[0].field_groups_id;
          var body_fields =  req.body;
          var files_fields =  req.files;

          //console.log(body_fields);

          connection.query("select * from `tbl_fields` JOIN `tbl_repeater_fields` ON `tbl_repeater_fields`.`fields_id` = `tbl_fields`.`fields_id` where `tbl_fields`.`field_type_id` = 8 && `tbl_fields`.`field_groups_id` = ? ",field_groups_id, function(err, result) {
            //console.log(result);
            result.forEach(key => {
              fields_id = key.fields_id;
              repeater_field_name = key.repeater_field_name;
              field_sub_count = key.field_sub_count;
              Object.keys(body_fields).forEach(key => {
                        
                var page_meta_name = key;
                var page_meta_value = body_fields[key];
                var match = page_meta_name.match(fields_id);
                var ret = page_meta_name.replace('_'+fields_id,'');

                if(match != null){
                  if(repeater_field_name == ret) {
                    var temp = [];
                    var obj = {};
                    if(Array.isArray(page_meta_value)){
                      for(var i=0; i<field_sub_count; i++){
                        obj[i] = page_meta_value[i];
                      }
                      temp.push(obj);
                      repeater_array = JSON.stringify(temp);
                    } else {
                      obj[0] = page_meta_value;
                      temp.push(obj);
                      repeater_array = JSON.stringify(temp);
                    }
                    
                    //console.log(repeater_array);
                    connection.query("UPDATE tbl_repeater_fields set repeater_field_value = ? WHERE repeater_field_name = ? and fields_id = ?", [repeater_array,ret,fields_id], function(err, result) {
                      if(err) {
                          console.log(err);
                      } else {
                          //console.log(result);
                      }
                    })
                  }
                }
              });
              if(files_fields != null){
                console.log(files_fields);
                Object.keys(files_fields).forEach(key => {
                  var page_meta_name = key;
                  var page_meta_value = files_fields[key];
                  var match = page_meta_name.match(fields_id);
                  var ret = page_meta_name.replace('_'+fields_id,'');
                  
                  if(match != null){
                    if(repeater_field_name === ret) {
                      var temp_file = [];
                      var obj_file = {};
                      if(Array.isArray(page_meta_value)){
                        for(var i=0; i<page_meta_value.length; i++){
                          
                          obj_file[i] = page_meta_value[i]['name'];

                          if(obj_file[i]){
                            uploadPath = process.cwd() + '/public/upload/' + obj_file[i];
                            //console.log(uploadPath);
                            page_meta_value[i].mv(uploadPath, function(err) {
                              if (err){
                                console.log(err);
                              } else {
                                console.log("File uploaded!");
                              }
                            });
                          }
                        }
                      } else {
                        obj_file[0] = page_meta_value['name'];
                      }
                      temp_file.push(obj_file);

                      repeater_array_file = JSON.stringify(temp_file);
                      console.log(repeater_array_file);
                      
                      connection.query("UPDATE tbl_repeater_fields set repeater_field_value = ? WHERE repeater_field_name = ? and fields_id = ?", [repeater_array_file,ret,fields_id], function(err, result) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log(result);
                        }
                      });
                    }
                  }
                });
              }
            })
            //console.log(repeater_array_file);
          });
          connection.query("select * from `tbl_fields` where `tbl_fields`.`field_type_id` != 8 && `tbl_fields`.`field_groups_id` = ? ",field_groups_id, function(err, result) {
            //console.log(result);
            result.forEach(key => {
              fields_value = key.fields_value;
              if(files_fields != null){
                Object.keys(files_fields).forEach(key => {
                
                  var page_meta_name = key;
                  var page_meta_value = files_fields[key];
    
                  uploadPath = process.cwd() + '/public/upload/' + page_meta_value.name;
                  console.log(uploadPath);
    
                  if(fields_value == page_meta_name) {
                    page_meta_value.mv(uploadPath, function(err) {
                      if (err){
                        console.log(err);
                      } else {
                        console.log("File uploaded!");
                        connection.query("UPDATE tbl_page_meta set page_meta_value = ? WHERE page_meta_name = ? and field_groups_id = ?", [page_meta_value.name,page_meta_name,field_groups_id], function(err, result) {
                          if(err) {
                            console.log(err);
                          } else {
                            //console.log(result);
                          }
                        })
                      }
                    });
                  }
                });
              }
    
              Object.keys(body_fields).forEach(key => {
                //console.log(key, body_fields[key]);
                
                var page_meta_name = key;
                var page_meta_value = body_fields[key];
                
                if(fields_value == page_meta_name) {
                  connection.query("UPDATE tbl_page_meta set page_meta_value = ? WHERE page_meta_name = ? and field_groups_id = ?", [page_meta_value,page_meta_name,field_groups_id], function(err, result) {
                    if(err) {
                        console.log(err);
                    } else {
                        //console.log(result);
                    }
                  })
                }
              });
            });
            res.redirect('/admin/page_edit/'+id);
          });
        }
      })
    }
  })
});

/* GET custom_fields page. */
router.get('/custom_fields',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_pages", function(err, result) {
    //console.log(result);
    if(err) {
      res.render('admin/custom_fields', {error_message : err});
    } else {
      connection.query("select * from tbl_field_groups", function(err, field_groups) {
        console.log(field_groups);
        if(err) {
          res.render('admin/custom_fields', {error_message : err});
        } else {
          if(field_groups.length > 0){
            res.render('admin/custom_fields', {pages_list: result, field_groups_list: field_groups});
          } else {
            var field_groups = "";
            res.render('admin/custom_fields', {error_message : err, pages_list: result, field_groups_list: field_groups});
          }
        }
      })
    }
  })
});

/* POST save_field_groups page. */
router.post('/save_field_groups',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_pages where page_id = ? ", req.body.page_id , function(err, result) {
    console.log(result);
    if(err) {
      res.redirect('/admin/custom_fields');
    } else {
      const mybodydata = {
        field_groups_name : req.body.field_groups_name,
        page_name : result[0].page_name,
        page_id : req.body.page_id,
      }
    
      connection.query("insert into tbl_field_groups set ?", mybodydata, function(err, result) {
        if(err) {
            console.log(err);
            res.redirect('/admin/custom_fields');
        } else {
            console.log(result);
            res.redirect('/admin/custom_fields');
        }
      })
    }
  })
});

/* GET field_groups_edit page. */
router.get('/field_groups_edit/:id',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_field_type", function(err, field_type) {
    var id = req.params.id;
    console.log(req.params.id);
    if(err) {
      res.render('admin/field_groups_edit', {error_message : err});
    } else {
      connection.query("select * from tbl_field_groups where field_groups_id = ?", id, function(err, field_groups) {
        console.log(field_groups);
        if(err) {
          res.render('admin/field_groups_edit', {error_message : err});
        } else {
          if(field_groups.length > 0){
            var field_groups_name = '';
            field_groups.forEach(key => {
              field_groups_name = key.field_groups_name;
            });
          }
          connection.query("select * from tbl_fields where field_groups_id = ?", id, function(err, fields) {
            console.log(fields);
            if(err) {
              res.render('admin/field_groups_edit', {error_message : err});
            } else {
              if(req.session.error){
                var error = req.session.error;
                console.log(error);
              } else {
                var error = "";
                req.session.error = "";
              }
              if(fields.length < 0){
                var fields = "";
                res.render('admin/field_groups_edit', {error_message : error, field_type_list: field_type, field_groups_id : id, fields_list: fields,field_groups_name : field_groups_name});
              } else {
                res.render('admin/field_groups_edit', {error_message : error, field_groups_id : id,field_type_list: field_type, fields_list: fields, field_groups_name : field_groups_name});
              }
            }
          })
        }
      })
    }
  })
});

/* POST save_field page. */
router.post('/save_field',isAuthenticated, function(req, res, next) {

  connection.query("select * from tbl_fields WHERE fields_value = ? AND field_groups_id = ?", [req.body.field_name, req.body.field_groups_id], function(err, fields) {
    console.log(err);
    if(err) {
      req.session.error = "";
      res.redirect('back');
    } else {
      console.log(fields);
      if(fields.length > 0){
        req.session.error = "Field is already exists!";
        res.redirect('back');
      } else {
        req.session.error = "";
        var field_name = req.body.field_name;

        // if(req.body.field_type_id == "10"){ 
        //   let field_label = req.body.field_label.toLowerCase();
        //   field_name = field_label.replace(/ /g, "_");
        // } else {
        //   field_name = req.body.field_name;
        // }
        
        const mybodydata = {
          field_type_id : req.body.field_type_id,
          fields_name : req.body.field_label,
          fields_value : field_name,
          field_groups_id : req.body.field_groups_id,
          field_sub_count: req.body.field_sub_count,
          field_tab_id: req.body.field_tab_id,
        }
      
        connection.query("insert into tbl_fields set ?", mybodydata, function(err, result) {
          var field_groups_id = req.body.field_groups_id;
          if(err) {
              console.log(err);
              res.redirect('/admin/field_groups_edit/'+field_groups_id);
          } else {
            console.log(result);
            const page_meta = {
              page_meta_name : field_name,
              page_meta_value : "",
              field_groups_id : req.body.field_groups_id,
              fields_id: result.insertId
            }
            connection.query("insert into tbl_page_meta set ?", page_meta, function(err, result) {
              var field_groups_id = req.body.field_groups_id;
              if(err) {
                  console.log(err);
                  res.redirect('/admin/field_groups_edit/'+field_groups_id);
              } else {
                  console.log(result);
                  res.redirect('/admin/field_groups_edit/'+field_groups_id);
              }
            })
          }
        })
      }
    }
  })

});

/* GET field_groups_delete page. */
router.get('/field_groups_delete/:id',isAuthenticated, function (req, res, next){
  var deleteid = req.params.id;
  console.log(`Parameter value is ${deleteid}`);
  connection.query("select * from tbl_fields where field_groups_id = ? ", deleteid, function(err, field_groups) {
    console.log(field_groups);
    if(err) {
      res.render('admin/custom_fields', {error_message : err});
    } else {
      if(field_groups.length > 0){  
        var fields_id = [];
        var i = 0;
        field_groups.forEach(key => {
          fields_id[i] = key.fields_id;
          i++;
        });
        connection.query("delete from tbl_field_groups where field_groups_id = ? ", [deleteid], function (err, rows){
          console.log(err);
          if(err){
            res.render('admin/custom_fields', {error_message : err});
          } else {
            if(rows && rows.affectedRows > 0){
              connection.query("delete from tbl_fields where field_groups_id = ? ", [deleteid], function (err, rows){ 
                console.log(err);
                if(err){
                  res.render('admin/custom_fields', {error_message : err});
                } else {
                  if(rows && rows.affectedRows > 0){
                    connection.query("delete from tbl_page_meta where field_groups_id = ? ", [deleteid], function (err, rows){ 
                      console.log(err);
                      if(err){
                        res.render('admin/custom_fields', {error_message : err});
                      } else {
                        if(rows && rows.affectedRows > 0){
                          connection.query("delete from tbl_repeater_fields where fields_id IN (?) ", [fields_id], function (err, rows){ 
                            console.log(err);
                            if(err){
                              res.render('admin/custom_fields', {error_message : err});
                            } else {
                              if(rows && rows.affectedRows > 0){
                                res.redirect('back');
                              } else {
                                var err = "Data not found";
                                res.render('admin/custom_fields', {error_message : err});
                              }
                            }
                          })
                        } else {
                          var err = "Data not found";
                          res.render('admin/custom_fields', {error_message : err});
                        }
                      }
                    })
                  } else {
                    var err = "Data not found";
                    res.render('admin/custom_fields', {error_message : err});
                  }
                }
              })
            } else {
              var err = "Data not found";
              res.render('admin/custom_fields', {error_message : err});
            }
          }
        })
      } else {
        var err = "Data not found";
        res.render('admin/custom_fields', {error_message : err});
      }
    }
  })
});

/* GET field_groups_update page. */
router.get('/field_groups_update/:id',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_pages", function(err, pages) {
    var id = req.params.id;
    console.log(req.params.id);
    if(err) {
      res.render('admin/custom_fields', {error_message : err});
    } else {
      connection.query("select * from tbl_field_groups where field_groups_id = ? ", id, function(err, field_groups) {
        console.log(field_groups);
        if(err) {
          res.render('admin/field_groups_update', {error_message : err});
        } else {
          if(field_groups.length < 0){
            var field_groups = "";
            res.render('admin/field_groups_update', {pages_list: pages, field_groups_id : id, field_groups_list: field_groups});
          } else {
            res.render('admin/field_groups_update', {error_message : err, field_groups_id : id, pages_list: pages, field_groups_list: field_groups});
          }
        }
      })
    }
  })
});

/* GET update_field_groups page. */
router.post('/update_field_groups/:id',isAuthenticated, function (req, res, next){
  //console.log(req.body);
  console.log("Parameter ID " + req.params.id);
  connection.query("select * from tbl_pages where page_id = ? ", req.body.page_id , function(err, result) {
    console.log(result);
    if(err) {
      res.redirect('/admin/custom_fields');
    } else {
    
      var field_groups_id = req.params.id;
      var field_groups_name = req.body.field_groups_name;
      var page_name = result[0].page_name;
      var page_id = req.body.page_id;

      connection.query("update tbl_field_groups set field_groups_name = ?,page_name = ?, page_id = ? where field_groups_id = ? ", [field_groups_name, page_name,page_id,field_groups_id], function(err, result) {
        console.log(field_groups_id);
        if(err) {
          res.redirect('/admin/update_field_groups/'+field_groups_id);
        } else {
          res.redirect('/admin/custom_fields/');
        }
      })
    }
  })

});

/* GET field_edit page. */
router.get('/field_edit/:id',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_field_type", function(err, field_type) {
    var id = req.params.id;
    var errorUpdate = "";
    var errorRepeater = "";
    if(req.session.errorUpdate){
      errorUpdate = req.session.errorUpdate;
    } 
    if(req.session.errorRepeater){
      errorRepeater = req.session.errorRepeater;
    }
    console.log(req.params.id);
    if(err) {
      res.render('admin/field_edit', {error_message : errorUpdate, error_Repeater : errorRepeater});
    } else {
      connection.query("select * from tbl_fields where fields_id = ? ", id, function(err, fields) {
        console.log(fields);
        if(err) {
          res.render('admin/field_edit', {error_message : errorUpdate, error_Repeater : errorRepeater});
        } else {
          if(fields.length < 0){
            var fields = "";
            res.render('admin/field_edit', {field_type_list: field_type, field_groups_id : id, fields_list: fields});
          } else {
            connection.query("select * from tbl_repeater_fields where fields_id = ? ", id, function(err, repeater_fields) {
              console.log(repeater_fields);
              if(err) {
                res.render('admin/field_edit', {error_message : errorUpdate, error_Repeater : errorRepeater});
              } else {
                if(repeater_fields.length < 0){
                  var repeater_fields = "";
                  res.render('admin/field_edit', {repeater_fields_list : repeater_fields, field_type_list: field_type, field_groups_id : id, fields_list: fields});
                } else {
                  connection.query("select * from tbl_fields where field_type_id = '9'", function(err, tab_fields) {
                    console.log(tab_fields);
                    if(err) {
                      res.render('admin/field_edit', {error_message : errorUpdate, error_Repeater : errorRepeater});
                    } else {
                      if(tab_fields.length < 0){
                        var tab_fields = "";
                        res.render('admin/field_edit', {repeater_fields_list : repeater_fields, field_type_list: field_type, field_groups_id : id, fields_list: fields, tab_fields_list : tab_fields});
                      } else {
                        res.render('admin/field_edit', {repeater_fields_list : repeater_fields, error_message : errorUpdate, error_Repeater : errorRepeater, field_groups_id : id,field_type_list: field_type, fields_list: fields, tab_fields_list : tab_fields});
                      }
                    }
                  })
                }
              }
            })
          }
        }
      })
    }
  })
});

/* GET update_field page. */
router.post('/update_field/:id',isAuthenticated, function (req, res, next){
  console.log("Parameter ID " + req.params.id);

  var fields_id = req.params.id;
  var field_type_id = req.body.field_type_id;
  var fields_name = req.body.field_label;
  var fields_value = req.body.field_name;
  var field_groups_id = req.body.field_groups_id;
  var field_sub_count = req.body.field_sub_count;
  var field_tab_id = req.body.field_tab_id;

  var field_list = req.body;
  console.log(field_list);

  connection.query("select * from tbl_fields WHERE field_groups_id = ? AND fields_id != ? AND fields_value = ?", [req.body.field_groups_id, fields_id, req.body.field_name], function(err, fields) {
    console.log(err);
    console.log(fields);
    if(err) {
      req.session.errorUpdate = "";
      res.redirect('back');
    } else {
      if(fields.length > 0){
        req.session.errorUpdate = "Field is already exists!";
        res.redirect('back');
      } else {
        req.session.errorUpdate = "";

        connection.query("update tbl_fields set field_type_id = ?,fields_name = ?, fields_value = ?, field_groups_id = ?, field_sub_count = ?, field_tab_id = ? where fields_id = ? ", [field_type_id, fields_name, fields_value, field_groups_id, field_sub_count, field_tab_id, fields_id], function(err, result) {
          console.log(err);
          if(err) {
            res.redirect('/admin/field_edit/'+fields_id);
          } else {
            connection.query("update tbl_page_meta set page_meta_name = ? where fields_id = ? ", [fields_value, fields_id], function(err, result) {
              var field_groups_id = req.body.field_groups_id;
              if(err) {
                  console.log(err);
                  res.redirect('/admin/field_groups_edit/'+field_groups_id);
              } else {
                  console.log(result);
                  res.redirect('/admin/field_edit/'+fields_id);
              }
            })
          }
        })
      }
    }
  })
});

/* GET field_delete page. */
router.get('/field_delete/:id',isAuthenticated, function (req, res, next){
  var deleteid = req.params.id;
  console.log(`Parameter value is ${deleteid}`);
  connection.query("delete from tbl_fields where fields_id = ? ", [deleteid], function (err, rows){
    console.log(err);
    if(err){
      res.render('admin/field_edit', {error_message : err});
    } else {
      if(rows && rows.affectedRows > 0){
        connection.query("delete from tbl_page_meta where fields_id = ? ", [deleteid], function (err, rows){
          console.log(err);
          if(err){
            res.render('admin/field_edit', {error_message : err});
          } else {
            if(rows && rows.affectedRows > 0){
              connection.query("delete from tbl_repeater_fields where fields_id = ? ", [deleteid], function (err, rows){
                console.log(err);
                if(err){
                  res.render('admin/field_edit', {error_message : err});
                } else {
                  if(rows && rows.affectedRows > 0){
                    res.redirect('back');
                  } else {
                    var err = "Data not found";
                    res.render('admin/field_edit', {error_message : err});
                  }
                }
              })
            } else {
              var err = "Data not found";
              res.render('admin/field_edit', {error_message : err});
            }
          }
        })
      } else {
        var err = "Data not found";
        res.render('admin/field_edit', {error_message : err});
      }
    }
  })
});

/* Post save_repeater_fields page. */
router.post('/save_repeater_fields',isAuthenticated, function(req, res, next) {

  //console.log(req.body);

  var repeater_field_type_id = req.body.repeater_field_type_id;
  var repeater_field_label = req.body.repeater_field_label;
  var repeater_field_name = req.body.repeater_field_name;
  var fields_id = req.body.fields_id;

  connection.query("select * from tbl_repeater_fields WHERE fields_id = ? AND repeater_field_name = ?", [fields_id, repeater_field_name], function(err, repeater_field) {
    console.log(err);
    console.log(repeater_field);
    if(err) {
      req.session.errorRepeater = "";
      res.redirect('back');
    } else {
      if(repeater_field.length > 0){
        req.session.errorRepeater = "Field is already exists!";
        res.redirect('back');
      } else {
        req.session.errorRepeater = "";
        const repeater_fields = {
          field_type_id : repeater_field_type_id,
          repeater_field_label : repeater_field_label,
          repeater_field_name : repeater_field_name,
          repeater_field_value: "",
          fields_id: fields_id,
        }
        connection.query("insert into tbl_repeater_fields set ?", repeater_fields, function(err, result) {
          if(err) {
            console.log(err);
            res.redirect('/admin/field_edit/'+fields_id);
          } else {
            console.log(result);
            res.redirect('/admin/field_edit/'+fields_id);
          }
        })
      }
    }
  })
});

/* GET repeater_field_edit page. */
router.get('/repeater_field_edit/:id',isAuthenticated, function(req, res, next) {
  connection.query("select * from tbl_field_type", function(err, field_type) {
    var id = req.params.id;
    var errorRepeater = "";

    if(req.session.errorRepeater){
      errorRepeater = req.session.errorRepeater;
    }
    console.log(req.params.id);
    if(err) {
      res.redirect('back');
    } else {
      connection.query("select * from tbl_repeater_fields where repeater_field_id = ? ", id, function(err, repeater_field) {
        console.log(repeater_field);
        if(err) {
          res.redirect('back');
        } else {
          if(repeater_field.length < 0){
            var repeater_field = "";
            res.redirect('back');
          } else {
            res.render('admin/repeater_field_edit', {error_Repeater : errorRepeater, field_groups_id : id, field_type_list: field_type, repeater_fields_list: repeater_field});
          }
        }
      })
    }
  })
});

/* GET update_repeater_field page. */
router.post('/update_repeater_field/:id',isAuthenticated, function (req, res, next){
  console.log("Parameter ID " + req.params.id);

  var repeater_field_id = req.params.id;
  var field_type_id = req.body.repeater_field_type_id;
  var repeater_field_label = req.body.repeater_field_label;
  var repeater_field_name = req.body.repeater_field_name;
  var repeater_field_value = req.body.repeater_field_value;
  var fields_id = req.body.fields_id;

  connection.query("select * from tbl_repeater_fields WHERE fields_id = ? AND repeater_field_id != ? AND repeater_field_name = ?", [fields_id, repeater_field_id, repeater_field_name], function(err, repeater_fields) {
    console.log(err);
    console.log(repeater_fields);
    if(err) {
      req.session.errorRepeater = "";
      res.redirect('back');
    } else {
      if(repeater_fields.length > 0){
        req.session.errorRepeater = "Field is already exists!";
        res.redirect('back');
      } else {
        req.session.errorRepeater = "";

        connection.query("update tbl_repeater_fields set field_type_id = ?,repeater_field_label = ?, repeater_field_name = ?, repeater_field_value = ?, fields_id = ? where repeater_field_id = ? ", [field_type_id, repeater_field_label, repeater_field_name, repeater_field_value, fields_id, repeater_field_id], function(err, result) {
          console.log(err);
          if(err) {
            res.redirect('/admin/field_edit/'+fields_id);
          } else {
            console.log(result);
            res.redirect('/admin/field_edit/'+fields_id);
          }
        })
      }
    }
  })
});

/* GET repeater_field_delete page. */
router.get('/repeater_field_delete/:id',isAuthenticated, function (req, res, next){
  var deleteid = req.params.id;
  console.log(`Parameter value is ${deleteid}`);
  connection.query("delete from tbl_repeater_fields where repeater_field_id = ? ", [deleteid], function (err, rows){
    console.log(err);
    if(err){
      res.render('admin/field_edit', {error_message : err});
    } else {
      if(rows && rows.affectedRows > 0){
        res.redirect('back');
      } else {
        var err = "Data not found";
        res.render('admin/field_edit', {error_message : err});
      }
    }
  })
});

/* GET users page. */
router.get('/users',isAuthenticated, function(req, res, next) {
  var user_id = req.session.user_id; 
  connection.query("select * from tbl_users where user_id != ? ", user_id, function(err, result) {
    console.log(result);
    if(result.length < 0) {
      res.render('admin/users');
    } else {
      if(result.length > 0){
        if(req.session.error){
          var error = req.session.error;
          console.log(error);
        } else {
          var error = "";
          req.session.error = "";
        }
        res.render('admin/users', {usersList : result, error_message : error});
      } else {
        var result = "";
        res.render('admin/users', {usersList : result});
      }
    }
  })
});

/* Post save_user page. */
router.post('/save_user', function(req, res, next) {

  connection.query("select * from tbl_users where username = ?", [req.body.username], function(err, rows) {
    console.log(rows);
    if(rows.length > 0) {
      req.session.error = "Username is already exits!";
      res.redirect('/admin/users');
    } else {
      req.session.error = "";
      
      var hashpassword = md5(req.body.password);

      const mybodydata = {
        user_name : req.body.name,
        user_email : req.body.email,
        username : req.body.username,
        password : hashpassword,
        user_role: req.body.user_role,
        user_status: '1',
        user_full_name: ''
      }

      connection.query("insert into tbl_users set ?", mybodydata, function(err, result) {
          if(err) {
              console.log(err);
              res.redirect('/admin/users');
          } else {
              console.log(result);
              res.redirect('/admin/users');
          }
      })
    }
  })
});

/* POST user_edit page. */
router.get('/user_edit/:id',isAuthenticated, function(req, res, next) {

  var id = req.params.id;
  //console.log(id);

  connection.query("select * from tbl_users where user_id = ?", id, function(err, result) {
    console.log(result);
    var error = "";
    if(err) {
      res.redirect('/admin/users');
    } else {
      if(result.length > 0){
        res.render('admin/user_edit', {userinfo: result, user_id: id, error_message : error});
      } else {
        var result = "";
        res.render('admin/user_edit', {userinfo: result, user_id: id, error_message : error});
      }
    }
  })
});

/* GET save_update_user page. */
router.post('/save_update_user/:id',isAuthenticated, function (req, res, next){
  //console.log(req.body);
  console.log("Parameter ID " + req.params.id);

  var user_name = req.body.name;
  var user_email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var user_role = req.body.user_role;
  var user_id = req.params.id;

  if(password == ''){
    connection.query("update tbl_users set user_name = ?, user_email = ?, username = ?, user_role = ? where user_id = ? ", [user_name, user_email, username, user_role, user_id], function(err, result) {
      console.log(user_id);
      if(err) {
        res.redirect('/admin/user_edit/'+user_id);
      } else {
        res.redirect('/admin/users');
      }
    })
  } else {
    var hashpassword = md5(password);
    connection.query("update tbl_users set user_name = ?, user_email = ?, username = ?, password = ?, user_role = ? where user_id = ? ", [user_name, user_email, username, hashpassword, user_role, user_id], function(err, result) {
      console.log(user_id);
      if(err) {
        res.redirect('/admin/user_edit/'+user_id);
      } else {
        res.redirect('/admin/users');
      }
    })
  }

});

module.exports = router;