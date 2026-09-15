nothing=False
def check(dutyList,dutyListX,dutyListY,specialList,cycList,n,command,position,get):
    if len(command[1])==2:
        if command[1][0] in ['上','下','左','右'] and command[1][1] not in ['x','y'] and command[1][1].isdigit()==False:
            _l=[]
            x,y=position[0],position[1]
            for i in range(len(command[1][1])):
                i = command[1][1][i]
                if i == 'x':
                    _l.append(str(position[0]))
                elif i == 'y':
                    _l.append(str(position[1]))
                else:
                    _l.append(i)
            command[1][1] = ''.join(_l)
            try:
                k = eval(command[1][1])
            except Exception:
                print('程序内：', n, '有误，说 后的值意义不明')
            if command[1][0] == '左':
                x -= k
            elif command[1][0] == '右':
                x += k
            elif command[1][0] == '下':
                y -= k
            elif command[1][0] == '上':
                y += k
            print(x,y)
            position[0] = x
            position[1] = y
    elif command[1][0]=='干净侦测':
        if not get:
            n=cycList[-1][-1]
            cycList.pop(-1)
    return n

