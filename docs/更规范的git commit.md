# 更规范的git commit

## 标准化的`git commit`格式

详情见[这里](https://www.conventionalcommits.org/en/v1.0.0/).

## `commitizen`

`commitizen`是一款命令行工具, 用于帮助你更快更精确的写出标准化的`git commit`.

### **如何安装(全局)**

安装`npm`

```bash
# 全局安装npm
$ sudo apt install -g npm
```

安装`commitizen`和`cz-conventional-changelog`

```bash
# 全局安装commitizen和cz-conventional-changelog
$ sudo npm install -g commitizen cz-conventional-changelog
```

在`home`目录下创建`.czrc`文件, 并写入你喜欢的`commitizen`适配器(这里用`cz-conventional-changelog`适配器作为示例)

```bash
$ echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc
```

现在, 你就可以使用`git cz`替代`git commit`来规范输出**commit**信息.

### **如何安装(局部)**

详见[这里](https://github.com/commitizen/cz-cli#optional-install-and-run-commitizen-locally).

## 使用`cz-emoji`作为`commitizen`的适配器

`cz-emoji`是一款使用**emoji**作为**commit**类型前缀的`commitizen`适配器.

这是[示例](https://github.com/ngryman/cz-emoji/commits/master).

### **如何安装(全局)**

```bash
# 全局安装cz-emoji
$ sudo npm install -g cz-emoji
# 将`cz-emoji`设置为默认适配器
$ echo '{ "path": "cz-emoji" }' > ~/.czrc
```

### **如何安装(局部)**

详见[这里](https://github.com/ngryman/cz-emoji#install).

## 使`git log`输出`emoji`

因为`cz-emoji`往**commit**里输出的`emoji`是`shortcode`形式, `emoji-shortcode`在`github`, `slack`中支持显示, 但在一般的`terminal`中都不支持显示`emoji-shortcode`. 我们使用[emojify](https://github.com/mrowa44/emojify)来修复这个小小的缺陷.

### **安装`emojify`**

执行以下命令

```bash
$ sudo sh -c "curl https://raw.githubusercontent.com/mrowa44/emojify/master/emojify -o /usr/local/bin/emojify && chmod +x /usr/local/bin/emojify"
```

或许你可能会出现👇的问题

```bash
curl: (7) Failed to connect to raw.githubusercontent.com port 443: Connection refused
```

至于为什么会出现这个问题, 只能说👮‍♀️**懂得都懂**👮‍♂️.

可以通过给`curl`命令添加代理的方式解决, 如下:

```bash
$ sudo sh -c "curl -x your-proxy https://raw.githubusercontent.com/mrowa44/emojify/master/emojify -o /usr/local/bin/emojify && chmod +x /usr/local/bin/emojify"
```

注意, `your-proxy`替换为你的代理地址.

### **使用`emojify`**

切换到一个带有`commit`输出中带有`emoji`符号的仓库, 使用👇命令

```bash
$ git log --oneline --color | emojify | less -r
```

就可以显示`shortcode`形式的`emoji`.

### **使用命令别名**

很明显, 上述的命令实在太长了, 可以为它设置一个别名, 方便调用.

打开`~/.gitconfig`进行编辑, 在文件末尾添加

```gitconfig
[alias]
	lg = ! git log --oneline --color | emojify | less -r
```

保存, 关闭.

再次切换到那个仓库, 使用

```bash
git lg
```

🎉🎉🎉就可以成功看到带有`emoji`的`git log`了🎉🎉🎉