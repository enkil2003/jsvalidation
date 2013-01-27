jsvalidation
============

A javascript filtering and validation bridge-to-validation framework. Suporting Zend Frameworks and Cake PHP.
This framework was created thinking about writting validations in one place and use it all over.
First I started working with Zend_Validate, Zend_Filter, Zend_Form and Zend_Form_Element_* and i thought that if i could expose those validations and filters, that could be readed by a javascript that maps those to javascript validations.
Then I needed to work with cake php, and i miss too much my validation, so I'm porting it now to cake php.

The validator is divided in to independent parts.

Javascript:

The validators need a object literal {} containing all the fields id that needs to validate.
In this object optionally you can pass all kind of callbacks to be runned when validation happends.
With this callbacks: beforeInvalidateElement, afterInvalidateElement, beforeValidateElement, afterValidateElement, beforeValidForm, afterValidForm, beforeInvalidForm, afterInvalidForm.
You can manipulate on element basis what you want to do.

Adapters:
Adapters are ways to write the object, currenty I have a very advanced Zend Framework 1.x, that reads all Zend_Form_Elements_*, Zend_Validate, Zend_Filter, and writes the object for you and can be added as a decorator to the form you want to validate.
Also i'm working with a CakePhp 1.* adapter that reads the model validation and then writes the object.

You could do this in a variety of ways, you could read an yml file, xml, or any kind of source and then write the javascript object.
You could make an adapter that reads attributes from html tags.

Once the object is in place, then you can extend manually your validation object. That can also be automatized :)

See examples folder to see how it works.
